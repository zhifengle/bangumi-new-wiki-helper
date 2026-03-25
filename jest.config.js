module.exports = {
  preset: 'ts-jest',
  setupFiles: ['<rootDir>/test/setupGlobals.js'],
  setupFilesAfterEnv: ['jest-extended'],
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '\\.(html|xml|txt)$': '<rootDir>/test/rawTransformer.js',
  },
};
