import fs from "fs";
import path from "path";
import crypto from "crypto";
import { blobToBase64Png } from "../utils.js";

export default class Workflowloader {
  constructor(workflowPath, client, saveImages = false) {
    this.workflowData = fs.readFileSync(
      path.join("./workflows", workflowPath),
      "utf-8"
    );
    this.client = client;
    this.saveImages = saveImages;
    if (saveImages) {
      if (!fs.existsSync(path.join("tmp", "outputs"))) {
        fs.mkdirSync(path.join("tmp", "outputs"), { recursive: true })
      }

    }
    this.placeholders = {};
    this.warnings = [];
    console.log(
      "New workflow loaded, json is: " +
      workflowPath +
      ", placeHolders are:" +
      this.getPlaceholders()
    );

    const handler = {
      set: function (target, prop, value) {
        target.placeholders[prop] = value;
        // if (prop === "modelPath") {
        //   target.warnings = target.warnings.filter(
        //     (w) => !w.includes("modelPath")
        //   );
        // }
        return true;
      },
    };
    return new Proxy(this, handler);
  }

  get finalize() {
    this.fillIfNotSet(); // Eksik değerleri doldur

    if (this.warnings.length > 0) {
      console.warn("Warnings:");
      this.warnings.forEach((warning) => console.warn(warning));
      return { status: false, message: this.warnings.join("\n") };
    }

    let updatedWorkflowString = this.workflowData;

    for (const [placeholder, value] of Object.entries(this.placeholders)) {
      const placeholderRegex = new RegExp(`{${placeholder}}`, "g");
      updatedWorkflowString = updatedWorkflowString.replace(
        placeholderRegex,
        value
      );
    }

    return { status: true, workflow: updatedWorkflowString };
  }

  prepare(obj) {
    const placeholders = this.getPlaceholders();
    const missingPlaceholders = [];
    const extraKeys = [];

    for (const [key, value] of Object.entries(obj)) {
      if (placeholders.includes(key)) {
        this.placeholders[key] = value;
      } else {
        extraKeys.push(key);
      }
    }

    for (const placeholder of placeholders) {
      if (!(placeholder in obj)) {
        missingPlaceholders.push(placeholder);
      }
    }

    if (extraKeys.length > 0) {
      console.log(`Placeholder(s) not found in the workflow: ${extraKeys.join(', ')}`);
    }

    if (missingPlaceholders.length > 0) {
      console.log(`Filling missing placeholders: ${missingPlaceholders.join(', ')}`);
      this.fillSpecificPlaceholders(missingPlaceholders);
    }

    return {
      missingPlaceholders,
      extraKeys
    };
  }

  async generate() {
    return new Promise(async (resolve, reject) => {
      try {
        const images = await this.client.getImages(JSON.parse(this.finalize.workflow));

        if (this.saveImages) {
          const outputDir = "./tmp/outputs";
          await this.client.saveImages(images, outputDir);
        }

        const imageArr = Object.values(images);
        let batch = imageArr[0];

        if (batch.length == 1) {
          let blob = batch[0].blob;
          const buf = await blob.arrayBuffer();
          resolve(buf.toString());
        } else {
          let response = [];
          for (let i = 0; i < batch.length; i++) {
            let base64DataUrl = await blobToBase64Png(batch[i].blob);
            response.push({
              filename: batch[i].image.filename,
              base64: base64DataUrl,
            });
          }
          resolve(response);
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  fillSpecificPlaceholders(placeholders) {
    placeholders.forEach(placeholder => {
      this.fillPlaceholder(placeholder);
      if (this.placeholders[placeholder] === undefined) {
        console.log(`Missing value for placeholder: ${placeholder}`);
      }
    });
  }
  getPlaceholders() {
    const placeholders = [];
    const jsonRegex = /{[^{}]*}/g;
    let match;

    while ((match = jsonRegex.exec(this.workflowData)) !== null) {
      try {
        const jsonObj = JSON.parse(match[0]);
        this.findPlaceholdersInObject(jsonObj, placeholders);
      } catch (e) {
        const placeholderMatch = match[0].match(/^{(\w+)}$/);
        if (placeholderMatch) {
          const placeholder = placeholderMatch[1];
          if (!placeholders.includes(placeholder)) {
            placeholders.push(placeholder);
          }
        }
      }
    }

    if (placeholders.includes("modelPath")) {
      // this.warnings.push(
      //   "Warning: 'modelPath' placeholder detected. Make sure to set it manually laan."
      // );
    }

    return placeholders;
  }

  findPlaceholdersInObject(obj, placeholders) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        const placeholderMatch = value.match(/^{(\w+)}$/);
        if (placeholderMatch) {
          const placeholder = placeholderMatch[1];
          if (!placeholders.includes(placeholder)) {
            placeholders.push(placeholder);
          }
        }
      } else if (typeof value === "object" && value !== null) {
        this.findPlaceholdersInObject(value, placeholders);
      } else {
        const keyPlaceholderMatch = key.match(/^{(\w+)}$/);
        if (keyPlaceholderMatch) {
          const placeholder = keyPlaceholderMatch[1];
          if (!placeholders.includes(placeholder)) {
            placeholders.push(placeholder);
          }
        }
      }
    }
  }

  fill() {
    const placeholders = this.getPlaceholders();
    placeholders.forEach((placeholder) => {
      this.fillPlaceholder(placeholder);
    });
  }

  fillPlaceholder(placeholder) {
    if (this.placeholders[placeholder] === undefined) {
      switch (placeholder) {
        case "steps":
          this.placeholders[placeholder] = 30;
          break;
        case "width":
        case "height":
          this.placeholders[placeholder] = 1024;
          break;
        case "batchSize":
          this.placeholders[placeholder] = 1;
          break;
        case "positive":
          this.placeholders[placeholder] =
            'A Web browser screen That Shows Styled Text which \\"ComfyUi-On-Steroids\\"';
          break;
        case "negative":
          this.placeholders[placeholder] = '';
          break;
        case "seed":
          this.placeholders[placeholder] = this.randomSeed();
          break;
        case "modelPath":
          break;
        default:
          this.warnings.push(
            `Warning: No default value for placeholder '${placeholder}'. Please set it manually.`
          );
      }
    }
  }

  fillIfNotSet() {
    const placeholders = this.getPlaceholders();
    placeholders.forEach((placeholder) => {
      this.fillPlaceholder(placeholder);
    });
  }

  randomSeed() {
    const buffer = crypto.randomBytes(7); // 7 byte = 14 basamak (hex)
    const randomNumber = parseInt(buffer.toString("hex"), 16); // Hexadecimal dizesini sayıya dönüştür

    return randomNumber.toString().padStart(14, "0"); // 14 basamaklı olacak şekilde soldan sıfırlar ekle
  }
}
