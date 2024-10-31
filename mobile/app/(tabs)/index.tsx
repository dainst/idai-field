import HomeScreen from '@/old/src/components/Home/HomeScreen';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Href, router } from 'expo-router';
export default function Index() {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <HomeScreen navigate={(screen: Href) =>
                          router.navigate(screen)} deleteProject={() => null} />
    </SafeAreaView>
  );
}
