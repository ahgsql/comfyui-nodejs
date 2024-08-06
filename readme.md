# ComfyUI Workflow Loader

ComfyUI Workflow Loader is a Node.js library designed to manage and manipulate ComfyUI workflows. This library allows you to load workflow JSON files, fill placeholders, and generate images based on the workflows.

## Features

- Load ComfyUI workflow JSON files
- Automatically detect placeholders
- Programmatically fill placeholders
- Provide default values for missing placeholders
- Generate updated workflows in JSON format
- Generate images based on the workflow
- Option to save generated images

## Installation

Install ComfyUI Workflow Loader using npm:

```bash
npm install comfyui-nodejs
```

## Usage

### Preparing Workflow

Open ComfyUI, load or edit your workflow, then save it in API format.

- edit workflow to add placeholders.
- Placeholders must be between curly braces.
- Paths or other escape charachters should be doubled.
  Ex:

```json
"ckpt_name": "Stable-diffusion\\SdXl\\sd_xl_turbo_1.0_fp16.safetensors"
```

there is two \ for paths.

- For numeric values use syntax like this :

```json
 "width": {width}
```

, (No quotes around {width})

- For strings ( like positive or negative prompt or model paths) use this syntax :

```json
   "text": "{positive}"
```

( quotes around placeholders)

- Save it into a folder named "workflows" inside your project root

### Basic Usage

```javascript
import { startComfyUi, initClient } from "comfyui-nodejs";
import Workflowloader from "comfyui-nodejs";

// Initialize the client
let client = await initClient();
await client.connect();

// Load the workflow
let flux = new Workflowloader("sdxl_turbo.json", client, true);

// Prepare placeholders
flux.prepare({
  positive: "a cat in red suit, throws basketball",
  steps: 1,
  batchSize: 2,
});

// Set additional placeholders
flux.width = 768;

// Generate images
let result = await flux.generate();

// Prepare new placeholders and generate again
flux.prepare({
  positive: "a giraffe",
  steps: 1,
});
//Or set individual placeholders.
flux.width = 1024;
await flux.generate();

console.log("Done");
```

## API

### `Workflowloader(workflowPath, client, saveImages)`

Creates a new Workflowloader instance.

- `workflowPath`: Path to the workflow JSON file.
- `client`: ComfyUI client instance.
- `saveImages`: Boolean, whether to save generated images (default: false).

### `prepare(obj)`

Fills placeholders using the provided object.

- `obj`: An object containing placeholder values.
- Returns: `{ missingPlaceholders, extraKeys }` object.

### `generate()`

Generates images based on the current workflow.

- Returns: A Promise that resolves to the generated image data.

### `finalize`

Returns the updated workflow.

- Returns: `{ status: boolean, workflow: string | null, message: string | null }`

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

We welcome contributions! Please read our contributing guide before submitting a pull request.

## Contact

For questions or feedback, please use [GitHub Issues](https://github.com/yourusername/comfyui-workflow-loader/issues).
