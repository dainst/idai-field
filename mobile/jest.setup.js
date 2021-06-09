import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
// see https://dev.to/mrmurphy/animating-text-content-with-redash-and-reanimated-2-3cmg
import 'react-native-reanimated';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/src/NativeAnimatedHelper');
