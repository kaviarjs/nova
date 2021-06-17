import { v4 as uuid } from "uuid";

const DEFAULT_RUN_TESTS = 10;

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
}

export async function testSuite(suites: ITestSuite[]) {
  for (const suite of suites) {
    const result = await testRunner(suite);
    console.log(suite.name, {
      fastest: result.fastest + "ms",
      slowest: result.slowest + "ms",
      mean: result.mean + "ms",
    });
    console.log("----");
  }
  console.log("Done");
}

export async function testRunner(
  suite: ITestSuite,
  times = DEFAULT_RUN_TESTS
): Promise<ITestResults> {
  let sum = 0;
  let fastest = 0;
  let slowest = Infinity;

  for (let i = 0; i < times; i++) {
    const now = new Date();
    await suite.run();
    const timeElapsed = new Date().getTime() - now.getTime();
    if (timeElapsed > fastest) {
      fastest = timeElapsed;
    }
    if (timeElapsed < slowest) {
      slowest = timeElapsed;
    }
    sum += timeElapsed;
  }

  return {
    fastest,
    slowest,
    mean: sum / times,
  };
}
