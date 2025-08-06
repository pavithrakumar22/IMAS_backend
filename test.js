import { highComplexityTool } from "./Agents/High/high.js";

const inp = "Aids with Lung Cancer";

highComplexityTool.func(inp).then((res) => {
    try {
        let response = res.replace(/```json[\s\S]*?```/g, '').trim();
        const result = JSON.parse(response);
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Error parsing the response: ", e);
    }
}).catch((e) => {
    console.log("Error: ", e);
});