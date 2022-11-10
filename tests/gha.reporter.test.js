import {describe, test, expect} from '@jest/globals';
import GhaReporter from '../src'

test('can be instantiated', () => {
    const gha = new GhaReporter();
    expect(gha).toBeTruthy();
    expect(gha).toBeInstanceOf(GhaReporter);
})

describe('Result tree generation', () => {
})

describe('Result tree output', () => {
})

describe('Reported interface', () => {
    test('onRunComplete', () => {
    })

    test('onTestResult', () => {
    })
})