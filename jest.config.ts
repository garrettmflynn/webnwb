import type {Config} from 'jest';

const config: Config = {
  coverageProvider: 'v8',
  preset: 'ts-jest/presets/default-esm', // or other ESM presets
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  transform: {
    "^.+\\.ya?ml$": "<rootDir>/jest-yaml-transformer.js",
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },

  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/'],
  coverageDirectory: './coverage',
  coveragePathIgnorePatterns: ['node_modules'],
  reporters: ['default'],
  extensionsToTreatAsEsm: ['.ts'],

  testTimeout: 10000, // Double the default timeout (to support fetch requests)

  verbose: true,
  silent: false
};

export default config