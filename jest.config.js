import nextJest from 'next/jest';

module.exports = {
  testEnvironment: 'jsdom', // or 'node' if you polyfill manually
  setupFiles: ['whatwg-fetch'],
};

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: "jest-environment-jsdom-latest",
  moduleNameMapper: {
    "^@/lib/(.*)$": "<rootDir>/app/lib/$1",
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
};

export default createJestConfig(customJestConfig);