import { highComplexityTool } from "./Agents/High/high.js";

const inp = "Aids with Lung Cancer";

highComplexityTool.func(inp).then((res) => {
    console.log('Test Result: ',res);
}).catch((e)=>{
    console.log(e);
});