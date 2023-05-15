module.exports = {
    clearMocks: true,
    collectCoverage: true,
    collectCoverageFrom: ['<rootDir>/src/**'],
    testMatch: ['**/*.test.ts'],
    coverageReporters: ['text'],
    transformIgnorePatterns: ['<rootDir>/node_modules/'],
    moduleFileExtensions: ['js', 'jsx', 'json', 'ts'],
    transform: {
      '^.+\\.ts$': 'ts-jest'
    },
    verbose: true,
}
