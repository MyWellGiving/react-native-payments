const mockReactNativeIOS = {
  Platform: {
    OS: 'ios'
  },
  DeviceEventEmitter: {
    removeSubscription: () => {},
    // index.js keeps the returned subscription and calls `.remove()` on it.
    addListener: () => ({ remove: () => {} })
  },
  // index.js picks NativeEventEmitter when NativeModules.ReactNativePayments
  // exists; leaving it undefined keeps the DeviceEventEmitter mock in play.
  NativeModules: {},
  NativeEventEmitter: function NativeEventEmitter() {
    return {
      removeSubscription: () => {},
      addListener: () => ({ remove: () => {} })
    };
  }
};

const mockReactNativeAndroid = Object.assign({}, mockReactNativeIOS, {
  Platform: {
    OS: 'android'
  }
});

const mockNativePaymentsSupportedIOS = {
  canMakePayments: () => true,
  createPaymentRequest: () => {},
  handleDetailsUpdate: async () => {},
  show: cb => cb(), // TODO, may have to fire an event that DeviceEventEmitter will listen to
  // NativeBridge.abort is promise-based on iOS (see index.js `abort()`).
  abort: () => Promise.resolve(true),
  complete: (paymentStatus, cb) => cb()
};

const mockNativePaymentsUnsupportedIOS = Object.assign(
  {},
  mockNativePaymentsSupportedIOS,
  {
    canMakePayments: () => false,
  }
);

module.exports = {
  mockReactNativeIOS,
  mockReactNativeAndroid,
  mockNativePaymentsSupportedIOS,
  mockNativePaymentsUnsupportedIOS
};
