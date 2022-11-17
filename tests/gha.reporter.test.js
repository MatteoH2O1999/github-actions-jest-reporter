import {afterAll, beforeAll, beforeEach, describe, jest, test, expect} from '@jest/globals';
import GhaReporter from '../src';
import util from 'util';
import chalk from 'chalk';

jest.mock('@actions/core');
const core = require('@actions/core');
core.startGroup.mockImplementation((groupName) => console.log('::group::' + groupName));
core.endGroup.mockImplementation(() => {console.log('::endgroup::')});

jest.mock('@jest/reporters');
const reporters = require('@jest/reporters');
reporters.utils.getSummary.mockReturnValue('Summary');

const xSymbol = '\u00D7';
const ySymbol = '\u2713';

test('can be instantiated', () => {
    const gha = new GhaReporter();
    expect(gha).toBeTruthy();
    expect(gha).toBeInstanceOf(GhaReporter);
})

describe('Result tree generation', () => {
    let oldLog;
    let consoleLog;

    beforeAll(() => {
        oldLog = console.log;
        console.log = (...data) => {
            consoleLog = consoleLog.concat(util.format(...data), '\n');
        }
    })

    beforeEach(() => {
        consoleLog = '';
    })

    afterAll(() => {
        console.log = oldLog;
    })

    test('failed single test without describe', () => {
        const testResults = [
            {
                ancestorTitles: [],
                title: 'test',
                status: 'failed',
                duration: 10
            }
        ]
        const testContext = {
        };
        const suitePerf = {
            runtime: 20,
            slow: false
        };
        const expectedResults = {
            name: '/',
            passed: false,
            performanceInfo: {
                runtime: 20,
                slow: false
            },
            children: [
                {
                    name: 'test',
                    duration: 10,
                    passed: false,
                    children: []
                }
            ]
        };
        const gha = new GhaReporter();

        const generated = gha.__getResultTree(testResults, '/', suitePerf);

        expect(consoleLog).toBe('');
        expect(generated).toEqual(expectedResults);
    })

    test('passed single test without describe', () => {
        const testResults = [
            {
                ancestorTitles: [],
                title: 'test',
                status: 'passed',
                duration: 10
            }
        ]
        const testContext = {
        };
        const suitePerf = {
            runtime: 20,
            slow: false
        };
        const expectedResults = {
            name: '/',
            passed: true,
            performanceInfo: {
                runtime: 20,
                slow: false
            },
            children: [
                {
                    name: 'test',
                    duration: 10,
                    passed: true,
                    children: []
                }
            ]
        };
        const gha = new GhaReporter();

        const generated = gha.__getResultTree(testResults, '/', suitePerf);

        expect(consoleLog).toBe('');
        expect(generated).toEqual(expectedResults);
    })

    test('failed single test inside describe', () => {
        const testResults = [
            {
                ancestorTitles: ['Test describe'],
                title: 'test',
                status: 'failed',
                duration: 10
            }
        ]
        const testContext = {
        };
        const suitePerf = {
            runtime: 20,
            slow: false
        };
        const expectedResults = {
            name: '/',
            passed: false,
            performanceInfo: {
                runtime: 20,
                slow: false
            },
            children: [
                {
                    name: 'Test describe',
                    passed: false,
                    children: [
                        {
                            name: 'test',
                            passed: false,
                            duration: 10,
                            children: []
                        }
                    ]
                }
            ]
        };
        const gha = new GhaReporter();

        const generated = gha.__getResultTree(testResults, '/', suitePerf);

        expect(consoleLog).toBe('');
        expect(generated).toEqual(expectedResults);
    })

    test('passed single test inside describe', () => {
        const testResults = [
            {
                ancestorTitles: ['Test describe'],
                title: 'test',
                status: 'passed',
                duration: 10
            }
        ]
        const testContext = {
        };
        const suitePerf = {
            runtime: 20,
            slow: false
        };
        const expectedResults = {
            name: '/',
            passed: true,
            performanceInfo: {
                runtime: 20,
                slow: false
            },
            children: [
                {
                    name: 'Test describe',
                    passed: true,
                    children: [
                        {
                            name: 'test',
                            passed: true,
                            duration: 10,
                            children: []
                        }
                    ]
                }
            ]
        };
        const gha = new GhaReporter();

        const generated = gha.__getResultTree(testResults, '/', suitePerf);

        expect(consoleLog).toBe('');
        expect(generated).toEqual(expectedResults);
    })
})

describe('Result tree output', () => {
    let oldLog;
    let consoleLog;

    beforeAll(() => {
        oldLog = console.log;
        console.log = (...data) => {
            consoleLog = consoleLog.concat(util.format(...data), '\n');
        }
    })

    beforeEach(() => {
        consoleLog = '';
    })

    afterAll(() => {
        console.log = oldLog;
    })

    test('failed single test without describe', () => {
        const generatedTree = {
            name: '/',
            passed: false,
            performanceInfo: {
                runtime: 20,
                slow: false
            },
            children: [
                {
                    name: 'test',
                    duration: 10,
                    passed: false,
                    children: []
                }
            ]
        };
        const testContext = {
        };
        const expectedOutput = '  ' + chalk.bold.red.inverse('FAIL') + ' / (20 ms)\n    ' + chalk.red(xSymbol) + ' test (10 ms)\n';
        const gha = new GhaReporter();

        gha.__printResultTree(generatedTree);

        expect(consoleLog).toEqual(expectedOutput);
    })

    test('passed single test without describe', () => {
        const generatedTree = {
            name: '/',
            passed: true,
            performanceInfo: {
                runtime: 20,
                slow: false
            },
            children: [
                {
                    name: 'test',
                    duration: 10,
                    passed: true,
                    children: []
                }
            ]
        };
        const testContext = {
        };
        const expectedOutput = '::group::' + chalk.bold.green.inverse('PASS') + ' / (20 ms)\n  ' + chalk.green(ySymbol) + ' test (10 ms)\n::endgroup::\n';
        const gha = new GhaReporter();

        gha.__printResultTree(generatedTree);

        expect(consoleLog).toEqual(expectedOutput);
    })

    test('failed single test inside describe', () => {
        const generatedTree = {
            name: '/',
            passed: false,
            performanceInfo: {
                runtime: 20,
                slow: false
            },
            children: [
                {
                    name: 'Test describe',
                    passed: false,
                    children: [
                        {
                            name: 'test',
                            passed: false,
                            duration: 10,
                            children: []
                        }
                    ]
                }
            ]
        };
        const testContext = {
        };
        const expectedOutput = (
            '  ' + chalk.bold.red.inverse('FAIL') + ' / (20 ms)\n' +
            '    Test describe\n' + 
            '      ' + chalk.red(xSymbol) + ' test (10 ms)\n'
            );
        const gha = new GhaReporter();

        gha.__printResultTree(generatedTree);

        expect(consoleLog).toEqual(expectedOutput);
    })

    test('passed single test inside describe', () => {
        const generatedTree = {
            name: '/',
            passed: true,
            performanceInfo: {
                runtime: 20,
                slow: false
            },
            children: [
                {
                    name: 'Test describe',
                    passed: true,
                    children: [
                        {
                            name: 'test',
                            passed: true,
                            duration: 10,
                            children: []
                        }
                    ]
                }
            ]
        };
        const testContext = {
        };
        const expectedOutput = (
            '::group::' + chalk.bold.green.inverse('PASS') + ' / (20 ms)\n' +
            '  Test describe\n' + 
            '    ' + chalk.green(ySymbol) + ' test (10 ms)\n' +
            '::endgroup::\n'
        );
        const gha = new GhaReporter();

        gha.__printResultTree(generatedTree);

        expect(consoleLog).toEqual(expectedOutput);
    })
})

describe('Reporter interface', () => {
    let oldLog;
    let consoleLog;

    beforeAll(() => {
        oldLog = console.log;
        console.log = (...data) => {
            consoleLog = consoleLog.concat(util.format(...data), '\n');
        }
    })

    beforeEach(() => {
        consoleLog = '';
    })

    afterAll(() => {
        console.log = oldLog;
    })

    test('onRunComplete', () => {
        const mockResults = {};
        const mockContext = {};
        const expectedOutput = (
            '\n' +
            'Summary\n' +
            'Ran all test suites.\n'
        );
        const gha = new GhaReporter();

        gha.onRunComplete(mockContext, mockResults);

        expect(consoleLog).toEqual(expectedOutput);
    })

    test('onTestResult not last', () => {
        const mockTest = {
            context: {
                config: {
                    rootDir: '/testDir'
                }
            }
        };
        const mockTestResult = {
            testFilePath: '/testDir/test1.js',
            testResults: [
                {
                    ancestorTitles: [],
                    title: 'test1',
                    status: 'passed',
                    duration: 10
                }
            ],
            perfStats: {
                slow: false,
                runtime: 20
            }
        };
        const mockResults = {
            numPassedTestSuites: 1,
            numFailedTestSuites: 1,
            numTotalTestSuites: 3
        };
        const expectedOutput = (
            '::group::' + chalk.bold.green.inverse('PASS') + ' test1.js (20 ms)\n' +
            '  ' + chalk.green(ySymbol) + ' test1 (10 ms)\n' +
            '::endgroup::\n'
        );
        const gha = new GhaReporter();

        gha.onTestResult(mockTest, mockTestResult, mockResults);

        expect(consoleLog).toEqual(expectedOutput);
    })

    test('onTestResult last', () => {
        const mockTest = {
            context: {
                config: {
                    rootDir: '/testDir'
                }
            }
        };
        const mockTestResult = {
            testFilePath: '/testDir/test1.js',
            testResults: [
                {
                    ancestorTitles: [],
                    title: 'test1',
                    status: 'passed',
                    duration: 10
                }
            ],
            perfStats: {
                slow: false,
                runtime: 20
            },
            failureMessage: 'Failure message'
        };
        const mockResults = {
            numPassedTestSuites: 2,
            numFailedTestSuites: 1,
            numTotalTestSuites: 3,
            testResults: [
                mockTestResult
            ]
        };
        const expectedOutput = (
            '::group::' + chalk.bold.green.inverse('PASS') + ' test1.js (20 ms)\n' +
            '  ' + chalk.green(ySymbol) + ' test1 (10 ms)\n' +
            '::endgroup::\n' + 
            '\n' +
            '::group::Errors thrown in test1.js\n' + 
            'Failure message\n' +
            '::endgroup::\n' +
            '\n'
        );
        const gha = new GhaReporter();

        gha.onTestResult(mockTest, mockTestResult, mockResults);

        expect(consoleLog).toEqual(expectedOutput);
    })
})