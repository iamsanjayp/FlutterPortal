module.exports = {
  verbose: true,
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^react-native$': 'react-native-web'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  }
};
