import { testSuite } from "../common";
import { setup } from "./db";
import { runFixtures } from "./fixtures";
import { suites } from "./tests";

async function run() {
  await setup();
  // await runFixtures();
  await testSuite(suites);
}

run();
