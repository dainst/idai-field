// see https://dev.to/mrmurphy/animating-text-content-with-redash-and-reanimated-2-3cmg
import 'react-native-reanimated';


// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/src/NativeAnimatedHelper');
