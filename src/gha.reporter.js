const reporters = require('@jest/reporters');
const core = require('@actions/core');
const chalk = require('chalk');

class GithubActionsReporter extends reporters.BaseReporter {
    constructor(globalConfig, reporterOptions, reporterContext) {
        super();
        this._globalConfig = globalConfig;
        this._options = reporterOptions;
        this._context = reporterContext;
    }

    onTestResult(test, testResult, results) {
        this.__printFullResult(test.context, testResult);
        if (this.__isLastTestSuite(results)) {
            console.log('');
            if (this.__printFailedTestLogs(test, results)) {
                console.log('');
            }
        }
    }

    __isLastTestSuite(results) {
        const passedTestSuites = results.numPassedTestSuites;
        const failedTestSuites = results.numFailedTestSuites;
        const totalTestSuites = results.numTotalTestSuites;
        const computedTotal =  passedTestSuites + failedTestSuites;
        if (computedTotal < totalTestSuites) {
            return false;
        } else if (computedTotal === totalTestSuites) {
            return true;
        } else {
            throw "Sum(" + computedTotal + ") of passed (" + passedTestSuites + ") and failed (" + failedTestSuites + ") test suites is greater than the total number of test suites (" + totalTestSuites + "). Please report the bug at https://github.com/MatteoH2O1999/github-actions-jest-reporter/issues";
        }
    }
    
    onRunComplete(testContexts, results) {
        console.log('');
        console.log(reporters.utils.getSummary(results));
        console.log('Ran all test suites.');
    }

    __printFullResult(context, results) {
        const rootDir = context.config.rootDir;
        let testDir = results.testFilePath.replace(rootDir, '');
        testDir = testDir.slice(1, testDir.length);
        const resultTree = this.__getResultTree(results.testResults, testDir, results.perfStats);
        this.__printResultTree(resultTree);
    }

    __arrayEqual(a1, a2) {
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

    __arrayChild(a1, a2) {
        if (a1.length - a2.length !== 1) {
            return false;
        }
        for (let index = 0; index < a2.length; index++) {
            const element = a2[index];
            if (element !== a1[index]) {
                return false
            }
        }
        return true;
    }

    __getResultTree(suiteResult, testPath, suitePerf) {
        let root = {
            name: testPath,
            passed: true,
            performanceInfo: suitePerf,
            children: []
        };
        let branches = [];
        suiteResult.forEach(element => {
            if (element.ancestorTitles.length === 0) {
                let passed = true;
                if (element.status === 'failed') {
                    root.passed = false;
                    passed = false;
                } else if (element.status !== 'passed') {
                    throw "Expected status to be 'failed' or 'passed', got " + element.status;
                }
                if (isNaN(element.duration)) {
                    throw "Expected duration to be a number, got NaN";
                }
                root.children.push({
                    name: element.title,
                    passed: passed,
                    duration: Math.max(element.duration, 1),
                    children: []
                });
            } else {
                let alreadyInserted = false;
                for (let index = 0; index < branches.length; index++) {
                    if (this.__arrayEqual(branches[index], element.ancestorTitles.slice(0, 1))) {
                        alreadyInserted = true;
                        break;
                    }
                }
                if (!alreadyInserted) {
                    branches.push(element.ancestorTitles.slice(0, 1));
                }
            }
        });
        branches.forEach(element => {
            const newChild = this.__getResultChildren(suiteResult, element);
            if (!newChild.passed) {
                root.passed = false;
            }
            root.children.push(newChild);
        });
        return root;
    }

    __getResultChildren(suiteResult, ancestors) {
        let node = {
            name: ancestors.at(-1),
            passed: true,
            children: []
        };
        let branches = [];
        suiteResult.forEach(element => {
            let passed = true;
            if (this.__arrayEqual(element.ancestorTitles, ancestors)) {
                if (element.status === 'failed') {
                    node.passed = false;
                    passed = false;
                }
                node.children.push({
                    name: element.title,
                    passed: passed,
                    duration: Math.max(element.duration, 1),
                    children: []
                });
            } else if (this.__arrayChild(element.ancestorTitles.slice(0, ancestors.length + 1), ancestors)) {
                let alreadyInserted = false;
                for (let index = 0; index < branches.length; index++) {
                    if (this.__arrayEqual(branches[index], element.ancestorTitles.slice(0, ancestors.length + 1))) {
                        alreadyInserted = true;
                        break;
                    }
                }
                if (!alreadyInserted) {
                    branches.push(element.ancestorTitles.slice(0, ancestors.length + 1));
                }
            }
        });
        branches.forEach(element => {
            const newChild = this.__getResultChildren(suiteResult, element);
            if (!newChild.passed) {
                node.passed = false;
            }
            node.children.push(newChild);
        });
        return node;
    }

    __printResultTree(resultTree) {
        let perfMs;
        if (resultTree.performanceInfo.slow) {
            perfMs = ' (' + chalk.red.inverse(resultTree.performanceInfo.runtime + ' ms') + ')';
        } else {
            perfMs = ' (' + resultTree.performanceInfo.runtime + ' ms' + ')';
        }
        if (resultTree.passed) {
            core.startGroup(chalk.bold.green.inverse('PASS') + ' ' + resultTree.name + perfMs);
            resultTree.children.forEach(child => {
                this.__recursivePrintResultTree(child, true, 1);
            });
            core.endGroup();
        } else {
            console.log('  ' + chalk.bold.red.inverse('FAIL') + ' ' + resultTree.name + perfMs);
            resultTree.children.forEach(child => {
                this.__recursivePrintResultTree(child, false, 1);
            });
        }
    }

    __recursivePrintResultTree(resultTree, alreadyGrouped, depth) {
        if (resultTree.children.length === 0) {
            let numberSpaces = depth;
            if (!alreadyGrouped) {
                numberSpaces++;
            }
            const spaces = '  '.repeat(numberSpaces);
            let resultSymbol;
            if (resultTree.passed) {
                resultSymbol = chalk.green('\u2713');
            } else {
                resultSymbol = chalk.red('\u00D7');
            }
            console.log(spaces + resultSymbol + ' ' + resultTree.name + ' (' + resultTree.duration + ' ms)');
        } else {
            if (resultTree.passed) {
                if (alreadyGrouped) {
                    console.log('  '.repeat(depth) + resultTree.name);
                    resultTree.children.forEach(child => {
                        this.__recursivePrintResultTree(child, true, depth + 1);
                    });
                } else {
                    core.startGroup('  '.repeat(depth) + resultTree.name);
                    resultTree.children.forEach(child => {
                        this.__recursivePrintResultTree(child, true, depth + 1);
                    });
                    core.endGroup();
                }
            } else {
                console.log('  '.repeat(depth + 1) + resultTree.name);
                resultTree.children.forEach(child => {
                    this.__recursivePrintResultTree(child, false, depth + 1);
                });
            }
        }
    }

    __printFailedTestLogs(context, testResults) {
        const rootDir = context.context.config.rootDir;
        const results = testResults.testResults;
        let written = false;
        results.forEach(result => {
            let testDir = result.testFilePath;
            testDir = testDir.replace(rootDir, '');
            testDir = testDir.slice(1, testDir.length);
            if (result.failureMessage) {
                written = true;
                core.startGroup("Errors thrown in " + testDir);
                console.log(result.failureMessage);
                core.endGroup();
            }
        });
        return written;
    }
}

module.exports = GithubActionsReporter;