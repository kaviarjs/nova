import { testSuite } from "../common";
import "./db";
import { runFixtures } from "./fixtures";
// import { suites } from "./tests.sequelize";
import { suites } from "./tests.raw";

async function run() {
  await runFixtures();
  // await testSuite(suites);
  // Used for raw queries
  await testSuite(suites, { runSanityChecks: false });
  process.exit(0);
}

run();
