import * as core from '@actions/core';
import * as reporters from '@jest/reporters';
import {
  AggregatedResult,
  AssertionResult,
  Test,
  TestContext,
  TestResult
} from '@jest/test-result';
import chalk from 'chalk';

type ResultTree = {
  name: string;
  passed: boolean;
  performanceInfo: PerformanceInfo;
  children: (ResultTreeNode | ResultTreeLeaf)[];
};

type ResultTreeNode = {
  name: string;
  passed: boolean;
  children: (ResultTreeNode | ResultTreeLeaf)[];
};

type ResultTreeLeaf = {
  name: string;
  passed: boolean;
  duration: number;
  children: never[];
};

type PerformanceInfo = {
  end: number;
  runtime: number;
  slow: boolean;
  start: number;
};

export default class GithubActionsReporter extends reporters.BaseReporter {
  override onTestResult(
    test: Test,
    testResult: TestResult,
    results: AggregatedResult
  ): void {
    this.printFullResult(test.context, testResult);
    if (this.isLastTestSuite(results)) {
      core.info('');
      if (this.printFailedTestLogs(test, results)) {
        core.info('');
      }
    }
  }

  private isLastTestSuite(results: AggregatedResult): boolean {
    const passedTestSuites = results.numPassedTestSuites;
    const failedTestSuites = results.numFailedTestSuites;
    const totalTestSuites = results.numTotalTestSuites;
    const computedTotal = passedTestSuites + failedTestSuites;
    if (computedTotal < totalTestSuites) {
      return false;
    } else if (computedTotal === totalTestSuites) {
      return true;
    } else {
      throw new Error(
        `Sum(${computedTotal}) of passed (${passedTestSuites}) and failed (${failedTestSuites}) test suites is greater than the total number of test suites (${totalTestSuites}). Please report the bug at https://github.com/MatteoH2O1999/github-actions-jest-reporter/issues`
      );
    }
  }

  override onRunComplete(
    testContexts: Set<TestContext>,
    results: AggregatedResult
  ): void {
    core.info('');
    core.info(reporters.utils.getSummary(results));
    core.info('Ran all test suites.');
  }

  private printFullResult(context: TestContext, results: TestResult): void {
    const rootDir = context.config.rootDir;
    let testDir = results.testFilePath.replace(rootDir, '');
    testDir = testDir.slice(1, testDir.length);
    const resultTree = this.getResultTree(
      results.testResults,
      testDir,
      results.perfStats
    );
    this.printResultTree(resultTree);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private arrayEqual(a1: any[], a2: any[]): boolean {
    if (a1.length !== a2.length) {
      return false;
    }
    for (let index = 0; index < a1.length; index++) {
      const element = a1[index];
      if (element !== a2[index]) {
        return false;
      }
    }
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private arrayChild(a1: any[], a2: any[]): boolean {
    if (a1.length - a2.length !== 1) {
      return false;
    }
    for (let index = 0; index < a2.length; index++) {
      const element = a2[index];
      if (element !== a1[index]) {
        return false;
      }
    }
    return true;
  }

  private getResultTree(
    suiteResult: AssertionResult[],
    testPath: string,
    suitePerf: PerformanceInfo
  ): ResultTree {
    const root: ResultTree = {
      children: [],
      name: testPath,
      passed: true,
      performanceInfo: suitePerf
    };
    const branches: string[][] = [];
    for (const element of suiteResult) {
      if (element.ancestorTitles.length === 0) {
        let passed = true;
        if (element.status === 'failed') {
          root.passed = false;
          passed = false;
        } else if (element.status !== 'passed') {
          throw new Error(
            `Expected status to be 'failed' or 'passed', got ${element.status}`
          );
        }
        root.children.push({
          children: [],
          duration: Math.max(element.duration || 0, 1),
          name: element.title,
          passed
        });
      } else {
        let alreadyInserted = false;
        for (const branch of branches) {
          if (this.arrayEqual(branch, element.ancestorTitles.slice(0, 1))) {
            alreadyInserted = true;
            break;
          }
        }
        if (!alreadyInserted) {
          branches.push(element.ancestorTitles.slice(0, 1));
        }
      }
    }
    for (const element of branches) {
      const newChild = this.getResultChildren(suiteResult, element);
      if (!newChild.passed) {
        root.passed = false;
      }
      root.children.push(newChild);
    }
    return root;
  }

  private getResultChildren(
    suiteResult: AssertionResult[],
    ancestors: string[]
  ): ResultTreeNode | ResultTreeLeaf {
    const node: ResultTreeNode | ResultTreeLeaf = {
      children: [],
      name: ancestors[ancestors.length - 1],
      passed: true
    };
    const branches: string[][] = [];
    for (const element of suiteResult) {
      let passed = true;
      if (this.arrayEqual(element.ancestorTitles, ancestors)) {
        if (element.status === 'failed') {
          node.passed = false;
          passed = false;
        }
        node.children.push({
          children: [],
          duration: Math.max(element.duration || 0, 1),
          name: element.title,
          passed
        });
      } else if (
        this.arrayChild(
          element.ancestorTitles.slice(0, ancestors.length + 1),
          ancestors
        )
      ) {
        let alreadyInserted = false;
        for (const branch of branches) {
          if (
            this.arrayEqual(
              branch,
              element.ancestorTitles.slice(0, ancestors.length + 1)
            )
          ) {
            alreadyInserted = true;
            break;
          }
        }
        if (!alreadyInserted) {
          branches.push(element.ancestorTitles.slice(0, ancestors.length + 1));
        }
      }
    }
    for (const element of branches) {
      const newChild = this.getResultChildren(suiteResult, element);
      if (!newChild.passed) {
        node.passed = false;
      }
      node.children.push(newChild);
    }
    return node;
  }

  private printResultTree(resultTree: ResultTree): void {
    let perfMs;
    if (resultTree.performanceInfo.slow) {
      perfMs = ` (${chalk.red.inverse(
        `${resultTree.performanceInfo.runtime} ms`
      )})`;
    } else {
      perfMs = ` (${resultTree.performanceInfo.runtime} ms)`;
    }
    if (resultTree.passed) {
      core.startGroup(
        `${chalk.bold.green.inverse('PASS')} ${resultTree.name}${perfMs}`
      );
      for (const child of resultTree.children) {
        this.recursivePrintResultTree(child, true, 1);
      }
      core.endGroup();
    } else {
      core.info(
        `  ${chalk.bold.red.inverse('FAIL')} ${resultTree.name}${perfMs}`
      );
      for (const child of resultTree.children) {
        this.recursivePrintResultTree(child, false, 1);
      }
    }
  }

  private recursivePrintResultTree(
    resultTree: ResultTreeNode | ResultTreeLeaf,
    alreadyGrouped: boolean,
    depth: number
  ): void {
    if (resultTree.children.length === 0) {
      const leaf = resultTree as ResultTreeLeaf;
      let numberSpaces = depth;
      if (!alreadyGrouped) {
        numberSpaces++;
      }
      const spaces = '  '.repeat(numberSpaces);
      let resultSymbol;
      if (leaf.passed) {
        resultSymbol = chalk.green('\u2713');
      } else {
        resultSymbol = chalk.red('\u00D7');
      }
      core.info(`${spaces + resultSymbol} ${leaf.name} (${leaf.duration} ms)`);
    } else {
      const node = resultTree as ResultTreeNode;
      if (node.passed) {
        if (alreadyGrouped) {
          core.info('  '.repeat(depth) + node.name);
          for (const child of node.children) {
            this.recursivePrintResultTree(child, true, depth + 1);
          }
        } else {
          core.startGroup('  '.repeat(depth) + node.name);
          for (const child of node.children) {
            this.recursivePrintResultTree(child, true, depth + 1);
          }
          core.endGroup();
        }
      } else {
        core.info('  '.repeat(depth + 1) + node.name);
        for (const child of node.children) {
          this.recursivePrintResultTree(child, false, depth + 1);
        }
      }
    }
  }

  private printFailedTestLogs(
    context: Test,
    testResults: AggregatedResult
  ): boolean {
    const rootDir = context.context.config.rootDir;
    const results = testResults.testResults;
    let written = false;
    for (const result of results) {
      let testDir = result.testFilePath;
      testDir = testDir.replace(rootDir, '');
      testDir = testDir.slice(1, testDir.length);
      if (result.failureMessage) {
        written = true;
        core.startGroup(`Errors thrown in ${testDir}`);
        core.info(result.failureMessage);
        core.endGroup();
      }
    }
    return written;
  }
}
