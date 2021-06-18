import { testSuite } from "../common";
import "./db";
import { runFixtures } from "./fixtures";
import { suites } from "./tests.sequelize";

async function run() {
  await runFixtures();
  await testSuite(suites);
  process.exit(0);
}

run();
