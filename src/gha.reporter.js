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
            //const r = require('util')
            //console.log(r.inspect(resultTree, true, null, true));
            //console.log('---------------------------------------------------------------------\n--------------------------------------------------------\n-------------------------------------------')
        })
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

    __getResultTree(suiteResult, testPath) {
        let root = {
            name: testPath,
            passed: true,
            children: []
        };
        let branches = [];
        suiteResult.forEach(element => {
            if (element.ancestorTitles.length === 0) {
                let passed = true;
                if (element.status === 'failed') {
                    root.passed = false;
                    passed = false;
                };
                root.children.push({
                    name: element.title,
                    passed: passed,
                    children: []
                });
            } else if (element.ancestorTitles.length === 1) {
                let alreadyInserted = false;
                for (let index = 0; index < branches.length; index++) {
                    if (this.__arrayEqual(branches[index], element.ancestorTitles)) {
                        alreadyInserted = true;
                        break;
                    }
                }
                if (!alreadyInserted) {
                    branches.push(element.ancestorTitles);
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
                    children: []
                });
            } else if (this.__arrayChild(element.ancestorTitles, ancestors)) {
                let alreadyInserted = false;
                for (let index = 0; index < branches.length; index++) {
                    if (this.__arrayEqual(branches[index], element.ancestorTitles)) {
                        alreadyInserted = true;
                        break;
                    }
                }
                if (!alreadyInserted) {
                    branches.push(element.ancestorTitles);
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
        if (resultTree.passed) {
            core.startGroup('PASS ' + resultTree.name);
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
        if (resultTree.children.length === 0) {
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
                console.log('  '.repeat(depth) + resultTree.name);
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