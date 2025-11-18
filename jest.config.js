export default {
  transform: {
    '^.+\\.ts$': '@swc/jest'
  },
  testRegex: 'tests/(.*?/)?.*test\\.ts$',
  moduleFileExtensions: ['ts', 'js'],
  testEnvironment: 'node'
}
