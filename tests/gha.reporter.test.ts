import * as core from '@actions/core';
import * as reporters from '@jest/reporters';
import {
  AggregatedResult,
  AssertionResult,
  Status,
  Test,
  TestContext,
  TestResult
} from '@jest/test-result';
import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  jest,
  test
} from '@jest/globals';
import GhaReporter from '../src';

function normalizeIcons(str: string): string {
  if (!str) {
    return str;
  }
  return str.replace(/\u00D7/gu, '\u2715').replace(/\u221A/gu, '\u2713');
}

jest.mock('@actions/core');
const mockedCore = jest.mocked(core);
mockedCore.startGroup.mockImplementation(groupName =>
  core.info(`::group::${groupName}`)
);
mockedCore.endGroup.mockImplementation(() => {
  core.info('::endgroup::');
});

jest.mock('@jest/reporters');
const mockedReporters = jest.mocked(reporters);
mockedReporters.utils.getSummary.mockReturnValue('Summary');

test('can be instantiated', () => {
  const gha = new GhaReporter();
  expect(gha).toBeTruthy();
  expect(gha).toBeInstanceOf(GhaReporter);
});

describe('Result tree generation', () => {
  let consoleLog: string;

  beforeAll(() => {
    mockedCore.info.mockImplementation(message => {
      consoleLog = consoleLog.concat(normalizeIcons(message), '\n');
    });
  });

  beforeEach(() => {
    consoleLog = '';
  });

  test('failed single test without describe', () => {
    const testResults = [
      {
        ancestorTitles: [],
        duration: 10,
        status: 'failed',
        title: 'test'
      }
    ] as unknown as Array<AssertionResult>;
    const suitePerf = {
      end: 30,
      runtime: 20,
      slow: false,
      start: 10
    };
    const expectedResults = {
      children: [
        {
          children: [],
          duration: 10,
          name: 'test',
          status: 'failed'
        }
      ],
      name: '/',
      passed: false,
      performanceInfo: {
        end: 30,
        runtime: 20,
        slow: false,
        start: 10
      }
    };
    const gha = new GhaReporter();

    const generated = gha['getResultTree'](testResults, '/', suitePerf);

    expect(consoleLog).toBe('');
    expect(generated).toEqual(expectedResults);
  });

  test('passed single test without describe', () => {
    const testResults = [
      {
        ancestorTitles: [],
        duration: 10,
        status: 'passed',
        title: 'test'
      }
    ] as unknown as Array<AssertionResult>;
    const suitePerf = {
      end: 30,
      runtime: 20,
      slow: false,
      start: 10
    };
    const expectedResults = {
      children: [
        {
          children: [],
          duration: 10,
          name: 'test',
          status: 'passed'
        }
      ],
      name: '/',
      passed: true,
      performanceInfo: {
        end: 30,
        runtime: 20,
        slow: false,
        start: 10
      }
    };
    const gha = new GhaReporter();

    const generated = gha['getResultTree'](testResults, '/', suitePerf);

    expect(consoleLog).toBe('');
    expect(generated).toEqual(expectedResults);
  });

  test('failed single test inside describe', () => {
    const testResults = [
      {
        ancestorTitles: ['Test describe'],
        duration: 10,
        status: 'failed',
        title: 'test'
      }
    ] as unknown as Array<AssertionResult>;
    const suitePerf = {
      end: 30,
      runtime: 20,
      slow: false,
      start: 10
    };
    const expectedResults = {
      children: [
        {
          children: [
            {
              children: [],
              duration: 10,
              name: 'test',
              status: 'failed'
            }
          ],
          name: 'Test describe',
          passed: false
        }
      ],
      name: '/',
      passed: false,
      performanceInfo: {
        end: 30,
        runtime: 20,
        slow: false,
        start: 10
      }
    };
    const gha = new GhaReporter();

    const generated = gha['getResultTree'](testResults, '/', suitePerf);

    expect(consoleLog).toBe('');
    expect(generated).toEqual(expectedResults);
  });

  test('passed single test inside describe', () => {
    const testResults = [
      {
        ancestorTitles: ['Test describe'],
        duration: 10,
        status: 'passed',
        title: 'test'
      }
    ] as unknown as Array<AssertionResult>;
    const suitePerf = {
      end: 30,
      runtime: 20,
      slow: false,
      start: 10
    };
    const expectedResults = {
      children: [
        {
          children: [
            {
              children: [],
              duration: 10,
              name: 'test',
              status: 'passed'
            }
          ],
          name: 'Test describe',
          passed: true
        }
      ],
      name: '/',
      passed: true,
      performanceInfo: {
        end: 30,
        runtime: 20,
        slow: false,
        start: 10
      }
    };
    const gha = new GhaReporter();

    const generated = gha['getResultTree'](testResults, '/', suitePerf);

    expect(consoleLog).toBe('');
    expect(generated).toEqual(expectedResults);
  });

  test('skipped single test and todo single test inside describe', () => {
    const testResults = [
      {
        ancestorTitles: ['Test describe'],
        duration: 10,
        status: 'skipped',
        title: 'test'
      },
      {
        ancestorTitles: ['Test describe'],
        duration: 14,
        status: 'todo',
        title: 'test2'
      }
    ] as unknown as Array<AssertionResult>;
    const suitePerf = {
      end: 30,
      runtime: 20,
      slow: false,
      start: 10
    };
    const expectedResults = {
      children: [
        {
          children: [
            {
              children: [],
              duration: 10,
              name: 'test',
              status: 'skipped'
            },
            {
              children: [],
              duration: 14,
              name: 'test2',
              status: 'todo'
            }
          ],
          name: 'Test describe',
          passed: true
        }
      ],
      name: '/',
      passed: true,
      performanceInfo: {
        end: 30,
        runtime: 20,
        slow: false,
        start: 10
      }
    };
    const gha = new GhaReporter();

    const generated = gha['getResultTree'](testResults, '/', suitePerf);

    expect(consoleLog).toBe('');
    expect(generated).toEqual(expectedResults);
  });
});

describe('Result tree output', () => {
  let consoleLog: string;

  beforeAll(() => {
    mockedCore.info.mockImplementation(message => {
      consoleLog = consoleLog.concat(normalizeIcons(message), '\n');
    });
  });

  beforeEach(() => {
    consoleLog = '';
  });

  test('failed single test without describe', () => {
    const generatedTree = {
      children: [
        {
          children: [],
          duration: 10,
          name: 'test',
          status: 'failed' as Status
        }
      ],
      name: '/',
      passed: false,
      performanceInfo: {
        end: 30,
        runtime: 20,
        slow: false,
        start: 10
      }
    };
    const gha = new GhaReporter();

    gha['printResultTree'](generatedTree);

    expect(consoleLog).toMatchSnapshot();
  });

  test('passed single test without describe', () => {
    const generatedTree = {
      children: [
        {
          children: [],
          duration: 10,
          name: 'test',
          status: 'passed' as Status
        }
      ],
      name: '/',
      passed: true,
      performanceInfo: {
        end: 30,
        runtime: 20,
        slow: false,
        start: 10
      }
    };
    const gha = new GhaReporter();

    gha['printResultTree'](generatedTree);

    expect(consoleLog).toMatchSnapshot();
  });

  test('failed single test inside describe', () => {
    const generatedTree = {
      children: [
        {
          children: [
            {
              children: [],
              duration: 10,
              name: 'test',
              status: 'failed' as Status
            }
          ],
          name: 'Test describe',
          passed: false
        }
      ],
      name: '/',
      passed: false,
      performanceInfo: {
        end: 30,
        runtime: 20,
        slow: false,
        start: 10
      }
    };
    const gha = new GhaReporter();

    gha['printResultTree'](generatedTree);

    expect(consoleLog).toMatchSnapshot();
  });

  test('passed single test inside describe', () => {
    const generatedTree = {
      children: [
        {
          children: [
            {
              children: [],
              duration: 10,
              name: 'test',
              status: 'passed' as Status
            }
          ],
          name: 'Test describe',
          passed: true
        }
      ],
      name: '/',
      passed: true,
      performanceInfo: {
        end: 30,
        runtime: 20,
        slow: false,
        start: 10
      }
    };
    const gha = new GhaReporter();

    gha['printResultTree'](generatedTree);

    expect(consoleLog).toMatchSnapshot();
  });

  test('todo single test inside describe', () => {
    const generatedTree = {
      children: [
        {
          children: [
            {
              children: [],
              duration: 10,
              name: 'test',
              status: 'todo' as Status
            }
          ],
          name: 'Test describe',
          passed: true
        }
      ],
      name: '/',
      passed: true,
      performanceInfo: {
        end: 30,
        runtime: 20,
        slow: false,
        start: 10
      }
    };
    const gha = new GhaReporter();

    gha['printResultTree'](generatedTree);

    expect(consoleLog).toMatchSnapshot();
  });

  test('skipped single test inside describe', () => {
    const generatedTree = {
      children: [
        {
          children: [
            {
              children: [],
              duration: 10,
              name: 'test',
              status: 'skipped' as Status
            }
          ],
          name: 'Test describe',
          passed: true
        }
      ],
      name: '/',
      passed: true,
      performanceInfo: {
        end: 30,
        runtime: 20,
        slow: false,
        start: 10
      }
    };
    const gha = new GhaReporter();

    gha['printResultTree'](generatedTree);

    expect(consoleLog).toMatchSnapshot();
  });
});

describe('Reporter interface', () => {
  let consoleLog: string;

  beforeAll(() => {
    mockedCore.info.mockImplementation(message => {
      consoleLog = consoleLog.concat(normalizeIcons(message), '\n');
    });
  });

  beforeEach(() => {
    consoleLog = '';
  });

  test('onRunComplete', () => {
    const mockResults = {};
    const mockContext = {};
    const gha = new GhaReporter();

    gha.onRunComplete(
      mockContext as unknown as Set<TestContext>,
      mockResults as unknown as AggregatedResult
    );

    expect(consoleLog).toMatchSnapshot();
  });

  test('onTestResult not last', () => {
    const mockTest = {
      context: {
        config: {
          rootDir: '/testDir'
        }
      }
    };
    const mockTestResult = {
      perfStats: {
        runtime: 20,
        slow: false
      },
      testFilePath: '/testDir/test1.js',
      testResults: [
        {
          ancestorTitles: [],
          duration: 10,
          status: 'passed',
          title: 'test1'
        }
      ]
    };
    const mockResults = {
      numFailedTestSuites: 1,
      numPassedTestSuites: 1,
      numTotalTestSuites: 3
    };
    const gha = new GhaReporter();

    gha.onTestResult(
      mockTest as Test,
      mockTestResult as unknown as TestResult,
      mockResults as AggregatedResult
    );

    expect(consoleLog).toMatchSnapshot();
  });

  test('onTestResult last', () => {
    const mockTest = {
      context: {
        config: {
          rootDir: '/testDir'
        }
      }
    };
    const mockTestResult = {
      failureMessage: 'Failure message',
      perfStats: {
        runtime: 20,
        slow: false
      },
      testFilePath: '/testDir/test1.js',
      testResults: [
        {
          ancestorTitles: [],
          duration: 10,
          status: 'passed',
          title: 'test1'
        }
      ]
    };
    const mockResults = {
      numFailedTestSuites: 1,
      numPassedTestSuites: 2,
      numTotalTestSuites: 3,
      testResults: [mockTestResult]
    };
    const gha = new GhaReporter();

    gha.onTestResult(
      mockTest as Test,
      mockTestResult as unknown as TestResult,
      mockResults as unknown as AggregatedResult
    );

    expect(consoleLog).toMatchSnapshot();
  });
});
