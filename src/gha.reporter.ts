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
import chalk from 'chalk';
import {specialChars} from 'jest-util';

const ICONS = specialChars.ICONS;

type PerformanceInfo = {
  end: number;
  runtime: number;
  slow: boolean;
  start: number;
};

type ResultTreeLeaf = {
  name: string;
  status: Status;
  duration: number;
  children: Array<never>;
};

type ResultTreeNode = {
  name: string;
  passed: boolean;
  children: Array<ResultTreeNode | ResultTreeLeaf>;
};

type ResultTree = {
  children: Array<ResultTreeLeaf | ResultTreeNode>;
  name: string;
  passed: boolean;
  performanceInfo: PerformanceInfo;
};
export default class GithubActionsReporter extends reporters.BaseReporter {
  override onTestResult(
    test: Test,
    testResult: TestResult,
    results: AggregatedResult
  ): void {
    this.printFullResult(test.context, testResult);
    if (this.isLastTestSuite(results)) {
      this.printFailedTestLogs(test, results);
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
    this.log('');
    this.log(reporters.utils.getSummary(results));
    this.log('Ran all test suites.');
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
    if (resultTree.children.length === 0) {
      if (results.failureMessage == null) {
        throw new Error('Expected a suite that failed to run');
      }
      resultTree.passed = false;
    }
    this.printResultTree(resultTree);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private arrayEqual(a1: Array<any>, a2: Array<any>): boolean {
    if (a1.length !== a2.length) {
      return false;
    }
    for (const [index, element] of a1.entries()) {
      if (element !== a2[index]) {
        return false;
      }
    }
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private arrayChild(a1: Array<any>, a2: Array<any>): boolean {
    if (a1.length - a2.length !== 1) {
      return false;
    }
    for (const [index, element] of a2.entries()) {
      if (element !== a1[index]) {
        return false;
      }
    }
    return true;
  }

  private getResultTree(
    suiteResult: Array<AssertionResult>,
    testPath: string,
    suitePerf: PerformanceInfo
  ): ResultTree {
    const root: ResultTree = {
      children: [],
      name: testPath,
      passed: true,
      performanceInfo: suitePerf
    };
    const branches: Array<Array<string>> = [];
    for (const element of suiteResult) {
      if (element.ancestorTitles.length === 0) {
        if (element.status === 'failed') {
          root.passed = false;
        }
        const duration = element.duration || 1;
        root.children.push({
          children: [],
          duration,
          name: element.title,
          status: element.status
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
    suiteResult: Array<AssertionResult>,
    ancestors: Array<string>
  ): ResultTreeNode {
    const node: ResultTreeNode = {
      children: [],
      name: ancestors[ancestors.length - 1] || '',
      passed: true
    };
    const branches: Array<Array<string>> = [];
    for (const element of suiteResult) {
      let duration = element.duration;
      if (!duration || Number.isNaN(duration)) {
        duration = 1;
      }
      if (this.arrayEqual(element.ancestorTitles, ancestors)) {
        if (element.status === 'failed') {
          node.passed = false;
        }
        node.children.push({
          children: [],
          duration,
          name: element.title,
          status: element.status
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
      this.startGroup(
        `${chalk.bold.green.inverse('PASS')} ${resultTree.name}${perfMs}`
      );
      for (const child of resultTree.children) {
        this.recursivePrintResultTree(child, true, 1);
      }
      this.endGroup();
    } else {
      this.log(
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
      if (!('duration' in resultTree)) {
        throw new Error('Expected a leaf. Got a node.');
      }
      let numberSpaces = depth;
      if (!alreadyGrouped) {
        numberSpaces++;
      }
      const spaces = '  '.repeat(numberSpaces);
      let resultSymbol;
      switch (resultTree.status) {
        case 'passed':
          resultSymbol = chalk.green(ICONS.success);
          break;
        case 'failed':
          resultSymbol = chalk.red(ICONS.failed);
          break;
        case 'todo':
          resultSymbol = chalk.magenta(ICONS.todo);
          break;
        case 'pending':
        case 'skipped':
          resultSymbol = chalk.yellow(ICONS.pending);
          break;
      }
      this.log(
        `${spaces}${resultSymbol} ${resultTree.name} (${resultTree.duration} ms)`
      );
    } else {
      if (!('passed' in resultTree)) {
        throw new Error('Expected a node. Got a leaf');
      }
      if (resultTree.passed) {
        if (alreadyGrouped) {
          this.log('  '.repeat(depth) + resultTree.name);
          for (const child of resultTree.children) {
            this.recursivePrintResultTree(child, true, depth + 1);
          }
        } else {
          this.startGroup('  '.repeat(depth) + resultTree.name);
          for (const child of resultTree.children) {
            this.recursivePrintResultTree(child, true, depth + 1);
          }
          this.endGroup();
        }
      } else {
        this.log('  '.repeat(depth + 1) + resultTree.name);
        for (const child of resultTree.children) {
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
        if (!written) {
          this.log('');
          written = true;
        }
        this.startGroup(`Errors thrown in ${testDir}`);
        this.log(result.failureMessage);
        this.endGroup();
      }
    }
    return written;
  }

  override log(message: string): void {
    core.info(message);
  }

  private startGroup(title: string): void {
    core.startGroup(title);
  }

  private endGroup(): void {
    core.endGroup();
  }
}
