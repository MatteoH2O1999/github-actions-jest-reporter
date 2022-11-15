# Github Actions Jest reporter

[![Tests](https://github.com/MatteoH2O1999/github-actions-jest-reporter/actions/workflows/test.yml/badge.svg)](https://github.com/MatteoH2O1999/github-actions-jest-reporter/actions/workflows/test.yml)
[![Release](https://github.com/MatteoH2O1999/github-actions-jest-reporter/actions/workflows/release.yml/badge.svg)](https://github.com/MatteoH2O1999/github-actions-jest-reporter/actions/workflows/release.yml)
![Downloads](https://img.shields.io/npm/dw/@matteoh2o1999/github-actions-jest-reporter)
![License](https://img.shields.io/npm/l/@matteoh2o1999/github-actions-jest-reporter)
![Version](https://img.shields.io/npm/v/@matteoh2o1999/github-actions-jest-reporter)
![Node](https://img.shields.io/node/v/@matteoh2o1999/github-actions-jest-reporter)
![Dependent Packages](https://img.shields.io/librariesio/dependents/npm/@matteoh2o1999/github-actions-jest-reporter)
![Dependent Repositories](https://img.shields.io/librariesio/dependent-repos/npm/@matteoh2o1999/github-actions-jest-reporter)
![NPM Score](https://img.shields.io/npms-io/final-score/@matteoh2o1999/github-actions-jest-reporter)

A fast and easy way of navigating through the logs produced by Jest in the Github Actions UI.

![reporter demo](./demos/demo.gif)

## Motivation

Jest's default reporter omits all of the datails of the passed and outputs a continuous log of the failed ones.
While this is useful in a local development environment, it becomes cumbersome to read as a github action log.
The aim of this reporter is to log all the results (including passed tests), but folding them neatly as groups leveraging Github Actions builtin group function.
Logs of failures are grouped and folded by test file so they can be opened and read in a more organized way.

![reporter error log demo](./demos/error_log_demo.gif)

## Dependencies

The package depends on `jest` (obviously), `chalk` and the `@actions/core` package.

## Installation

The reporter can be installed directly from npm:

```bash
npm install --save-dev @matteoh2o1999/github-actions-jest-reporter
```

## Usage

There are two ways to use the reporter in your Jest testing.

### Create CI test script (recommended)

In your `package.json` just add a line in your script section:

```diff
{
    ...
    "scripts": {
        ...
        "test": "jest",
+       "test-ci": "jest --reporters='@matteoh2o1999/github-actions-jest-reporter'"
    }
}
```

Then in your `test.yml` use the new script instead of the old one:

```diff
steps:
  - name: Checkout code
  ...
  - name: Run tests
-   run: npm run test
+   run: npm run test-ci
```

### Add as reporter in `jest.config`

Add the reporter to the `reporters` array in your configuration file:

```diff
module.exports: {
    ...
-   reporters: [...],
+   reporters: [..., '@matteoh2o1999/github-actions-jest-reporter'],
}
```

> :warning: **Warning:** adding this reporter in your `jest.config` file will also impact local testing.

## Troubleshooting

### My logs are not colored

This is a known problem related to `chalk` not recognizing Github Actions terminal as capable of writing colors.

Until this is fixed on their end a workaround is to force color output with an environment variable:

```diff
steps:
  - name: Checkout code
  ...
  - name: Run tests
    run: npm run test-ci
+   env:
+     FORCE_COLOR: 1
```
