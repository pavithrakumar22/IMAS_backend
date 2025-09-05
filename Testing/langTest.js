// to run this test - run python translate.py 1st

import { mainGraph } from "../api/routes/langgraph.js";

async function runTest() {
  const iterator = await mainGraph.stream(
    { input: "Patient has fever from 2 days", src: "en", tgt: "en" },
    { asState: true }
  );

  for await (const step of iterator) {
    console.log("STEP >>>", step);
  }

  console.log("=== Test Finished ===");
}
runTest();