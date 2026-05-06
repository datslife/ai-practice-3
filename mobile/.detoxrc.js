/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: { config: 'e2e/jest.config.js', runInBand: true },
    jest: { setupTimeout: 120000 },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/ChatMobile.app',
      build:
        'xcodebuild -workspace ios/ChatMobile.xcworkspace -scheme ChatMobile -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build | xcpretty',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 16 Pro', os: 'iOS 18.4' },
    },
  },
  configurations: {
    'ios.sim.debug': { device: 'simulator', app: 'ios.debug' },
  },
};
