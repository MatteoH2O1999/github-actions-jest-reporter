const reporters = require('@jest/reporters');
const core = require('@actions/core');

class GithubActionsReporter extends reporters.BaseReporter {
    constructor(globalConfig, reporterOptions, reporterContext) {
        super();
        this._globalConfig = globalConfig;
        this._options = reporterOptions;
        this._context = reporterContext;
    }
    
    onRunComplete(testContexts, results) {
        this.__printFullResult(testContexts, results);
        this.__printSummary(results);
        console.log('Ran all test suites.');
    }

    __printFullResult(context, results) {
        const rootDir = context.values().next().value.config.rootDir;
        const testSuites = results.testResults;
        testSuites.forEach(element => {
            let testDir = element.testFilePath.replace(rootDir, '');
            testDir = testDir.slice(1, testDir.length);
            const resultTree = this.__getResultTree(element.testResults, testDir);
            this.__printResultTree(resultTree);
        })
    }

    __getResultTree(suiteResult, testPath) {
    }

    __printResultTree(resultTree) {
        if (resultTree.passed) {
            core.group('PASS ' + resultTree.name);
            resultTree.children.forEach(child => {
                this.__recursivePrintResultTree(child, true, 1);
            });
            core.endGroup();
        } else {
            console.log('FAIL ' + resultTree.name);
            resultTree.children.forEach(child => {
                this.__recursivePrintResultTree(child, false, 1);
            });
        }
    }

    __recursivePrintResultTree(resultTree, alreadyGrouped, depth) {
        if (resultTree.children.length == 0) {
            const spaces = '  '.repeat(depth);
            let resultSymbol;
            if (resultTree.passed) {
                resultSymbol = '\u2713';
            } else {
                resultSymbol = '\u00D7';
            }
            console.log(spaces + resultSymbol + ' ' + resultTree.name);
        } else {
            if (resultTree.passed) {
                if (alreadyGrouped) {
                    resultTree.children.forEach(child => {
                        this.__recursivePrintResultTree(child, true, depth + 1);
                    });
                } else {
                    core.group(resultTree.name);
                    resultTree.children.forEach(child => {
                        this.__recursivePrintResultTree(child, true, depth + 1);
                    });
                    core.endGroup();
                }
            } else {
                resultTree.children.forEach(child => {
                    this.__recursivePrintResultTree(child, false, depth + 1);
                });
            }
        }
    }

    __printSummary(results) {
        // TODO: this sucks, find better way to align
        console.log('');
        console.log("Test Suites: %d passed, %d total", results.numPassedTestSuites, results.numTotalTestSuites);
        console.log("Tests:       %d passed, %d total", results.numPassedTests, results.numTotalTests);
        console.log("Snapshots:   %d total", results.snapshot.total);
        console.log("Time:        %f s", (Date.now() - results.startTime) / 1000);
    }
}

module.exports = GithubActionsReporter;