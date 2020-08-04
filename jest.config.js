module.exports = {
  preset: 'ts-jest',
  setupFilesAfterEnv: ['jest-extended'],
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '\\.(html|xml|txt)$': 'jest-raw-loader',
  },
};
