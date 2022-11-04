module.exports = {
    collectCoverage: true,
    collectCoverageFrom: ['<rootDir>/src/**/*.js'],
    testMatch: ['<rootDir>/tests/**'],
    coverageReporters: ['text'],
    transformIgnorePatterns: ['<rootDir>/node_modules/'],
    moduleFileExtensions: ['js', 'jsx', 'json']
}