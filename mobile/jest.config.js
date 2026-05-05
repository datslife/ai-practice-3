module.exports = {
  preset: 'react-native',
  setupFilesAfterFramework: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-keychain|react-native-screens|react-native-safe-area-context|react-native-gesture-handler|socket.io-client|uuid)/)',
  ],
};
