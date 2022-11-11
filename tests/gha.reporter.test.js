import {afterAll, beforeAll, beforeEach, describe, jest, test, expect} from '@jest/globals';
import GhaReporter from '../src';
import util from 'util';
import chalk from 'chalk';

jest.mock('@actions/core');
const core = require('@actions/core');
core.startGroup.mockImplementation((groupName) => console.log('::group::' + groupName));
core.endGroup.mockImplementation(() => {console.log('::endgroup::')});

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
    })

    test('onTestResult', () => {
    })
})