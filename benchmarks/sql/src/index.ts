import { runFixtures } from "./sql/fixtures";

runFixtures().then(() => {
  console.log(`Fixtures added`);
});
