import crypto from "crypto";
import dotenv from "dotenv";
import { spawn } from "child_process";
import ngrok from "ngrok";
import path from "path";
import { ComfyUIClient } from "comfy-ui-client";
import { v4 as uuidv4 } from 'uuid';

function randomSeed() {
  const buffer = crypto.randomBytes(7); // 7 byte = 14 basamak (hex)
  const randomNumber = parseInt(buffer.toString("hex"), 16); // Hexadecimal dizesini sayıya dönüştür

  return randomNumber.toString().padStart(14, "0"); // 14 basamaklı olacak şekilde soldan sıfırlar ekle
}
async function blobToBase64Png(blob) {
  const buffer = Buffer.from(await blob.arrayBuffer());
  const base64DataString = buffer.toString("base64");
  return `data:image/png;base64,${base64DataString}`;
}

async function startComfyUi() {
  return new Promise((resolve, reject) => {
    dotenv.config();

    const comfyUiDir = process.env.COMFY_UI_PATH;
    const batFilePath = path.join(comfyUiDir, process.env.COMFY_UI_BAT);
    const batProcess = spawn("cmd.exe", ["/c", batFilePath], {
      cwd: comfyUiDir,
      shell: true,
      stdio: "pipe",
      windowsVerbatimArguments: true,
    });

    let lastOutputTime = Date.now();
    let outputTimer;

    const checkOutput = () => {
      if (Date.now() - lastOutputTime >= 5000) {
        clearInterval(outputTimer);
        resolve();
      }
    };

    outputTimer = setInterval(checkOutput, 1000);

    batProcess.stdout.on('data', (data) => {
      console.log(data.toString());

      lastOutputTime = Date.now();
    });

    batProcess.stderr.on('data', () => {
      lastOutputTime = Date.now();
    });

    batProcess.on("exit", (code) => {
      clearInterval(outputTimer);
      console.log(`Child process exited with code ${code}`);
      resolve();
    });

    batProcess.on("error", (error) => {
      clearInterval(outputTimer);
      reject(error);
    });
  });
}

async function initClient(adress = "127.0.0.1:8188") {
  const clientId = uuidv4();
  const client = new ComfyUIClient(adress, clientId);
  return client
}
export { randomSeed, blobToBase64Png, startComfyUi, initClient };
