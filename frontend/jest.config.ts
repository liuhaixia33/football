const defineJestConfig = require('@tarojs/test-utils-react/dist/jest.js').default

module.exports = defineJestConfig({
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/__tests__/**/*.(spec|test).[jt]s?(x)'],
  moduleNameMapper: {
    '@tarojs/taro': '<rootDir>/__mocks__/taro.ts'
  },
  preset: 'ts-jest'
})
