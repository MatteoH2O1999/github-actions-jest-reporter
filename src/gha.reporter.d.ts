import * as reporters from "@jest/reporters";
import * as types from '@jest/types'
import * as tests from '@jest/test-result'
export default class GithubActionsReporter extends reporters.BaseReporter {
    constructor(globalConfig: types.Config.GlobalConfig, reporterOptions: any, reporterContext: any);
    onTestResult(test: tests.Test, testResult: tests.TestResult, results: tests.AggregatedResult): void;
    onRunComplete(testContexts: Set<tests.TestContext>, results: tests.AggregatedResult): void;
}
