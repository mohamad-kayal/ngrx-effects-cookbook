import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/recipes/**/*.spec.ts'],
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$'
      }
    ]
  },
  moduleNameMapper: {
    '^@recipes/race-conditions$': '<rootDir>/recipes/01-race-conditions/index.ts',
    '^@recipes/race-conditions/(.*)$': '<rootDir>/recipes/01-race-conditions/$1',
    '^@recipes/retry-backoff$': '<rootDir>/recipes/02-retry-backoff/index.ts',
    '^@recipes/retry-backoff/(.*)$': '<rootDir>/recipes/02-retry-backoff/$1',
    '^@recipes/optimistic-rollback$': '<rootDir>/recipes/03-optimistic-rollback/index.ts',
    '^@recipes/optimistic-rollback/(.*)$': '<rootDir>/recipes/03-optimistic-rollback/$1',
    '^@recipes/polling-lifecycle$': '<rootDir>/recipes/04-polling-lifecycle/index.ts',
    '^@recipes/polling-lifecycle/(.*)$': '<rootDir>/recipes/04-polling-lifecycle/$1',
    '^@recipes/cancel-on-route$': '<rootDir>/recipes/05-cancel-on-route/index.ts',
    '^@recipes/cancel-on-route/(.*)$': '<rootDir>/recipes/05-cancel-on-route/$1',
    '^@recipes/cross-effect-coordination$': '<rootDir>/recipes/06-cross-effect-coordination/index.ts',
    '^@recipes/cross-effect-coordination/(.*)$': '<rootDir>/recipes/06-cross-effect-coordination/$1',
    '^@recipes/debounce-input$': '<rootDir>/recipes/07-debounce-input/index.ts',
    '^@recipes/debounce-input/(.*)$': '<rootDir>/recipes/07-debounce-input/$1',
    '^@recipes/long-running-progress$': '<rootDir>/recipes/08-long-running-progress/index.ts',
    '^@recipes/long-running-progress/(.*)$': '<rootDir>/recipes/08-long-running-progress/$1'
  }
};

export default config;