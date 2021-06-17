import "./db";
import { runFixtures } from "./fixtures";

async function run() {
  await runFixtures();
  console.log("done");
}

run();
