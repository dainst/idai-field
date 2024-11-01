import HomeScreen from '@/old/src/components/Home/HomeScreen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Href, router } from 'expo-router';
export default function Index() {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        // justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <HomeScreen navigate={router.navigate} deleteProject={() => null} />
    </SafeAreaView>
  );
}
