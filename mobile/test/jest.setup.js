jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockSecureStore = new Map();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key) => Promise.resolve(mockSecureStore.get(key) ?? null)),
  setItemAsync: jest.fn((key, value) => {
    mockSecureStore.set(key, value);
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key) => {
    mockSecureStore.delete(key);
    return Promise.resolve();
  }),
  __clearMock: () => mockSecureStore.clear(),
}), { virtual: true });
