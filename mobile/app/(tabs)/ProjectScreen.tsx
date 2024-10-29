import { Text } from 'react-native';
import usePreferences from '@/old/src/hooks/use-preferences';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
  // const preferences = usePreferences();
  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* {preferences.preferences.currentProject ? <ProjectScreen /> : <Text>Project not found</Text> } */}
      <Text>Project</Text>
    </SafeAreaView>
  );
}
