import { startComfyUi, initClient } from "./src/utils.js";
import Workflowloader from "./src/index.js";

let client = await initClient();
await client.connect()
let flux = new Workflowloader("sdxl_turbo.json", client, true)
flux.prepare({
    positive: "a cat in red suit, throws basketball",
    steps: 1,
    batchSize: 2
})
flux.width = 768
let a = await flux.generate()
flux.prepare({
    positive: "a giraffe",
    steps: 1,
})
await flux.generate()
console.log(" done ex");
