import { v4 as uuid } from "uuid";
import { sanity } from "./sanity";
import { DEFAULT_RUN_TESTS } from "./constants";

export function createRandomPost(index) {
  return {
    title: `Post - ${index}`,
  };
}

export function createRandomUser() {
  return {
    email: `user-${uuid()}@app.com`,
    password: `12345`,
  };
}

export function createComment() {
  return {
    text: "Hello Hello Hello Hello Hello",
  };
}

export interface ITestSuite {
  name: string;
  run: Function;
}

export interface ITestResults {
  fastest: number;
  slowest: number;
  mean: number;
  iterations: number;
  firstRun: number;
}

export async function testSuite(suites: ITestSuite[]) {
  for (const suite of suites) {
    const result = await testRunner(suite);
    console.log(suite.name, {
      fastest: result.fastest + "ms",
      slowest: result.slowest + "ms",
      mean: result.mean + "ms",
      firstRun: result.firstRun + "ms",
      iterations: result.iterations,
    });
  }
  console.log("Done");
}

export async function testRunner(
  suite: ITestSuite,
  times = DEFAULT_RUN_TESTS
): Promise<ITestResults> {
  let sum = 0;
  let slowest = 0;
  let firstRun = 0;
  let fastest = Infinity;

  for (let i = 0; i < times; i++) {
    const now = new Date();
    const result = await suite.run();

    const timeElapsed = new Date().getTime() - now.getTime();
    if (timeElapsed > slowest) {
      slowest = timeElapsed;
    }
    if (timeElapsed < fastest) {
      fastest = timeElapsed;
    }
    sum += timeElapsed;

    if (i === 0) {
      firstRun = timeElapsed;
    }

    if (i === 0 && sanity[suite.name]) {
      sanity[suite.name](result);
    }
  }

  return {
    fastest,
    slowest,
    mean: sum / times,
    iterations: times,
    firstRun,
  };
}
