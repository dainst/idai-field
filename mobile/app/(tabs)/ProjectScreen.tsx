import { Text, View } from 'react-native';
import ProjectScreen from '@/old/src/components/Project/ProjectScreen';
import SettingsScreen from '@/old/src/components/Settings/SettingsScreen';
import usePreferences from '@/old/src/hooks/use-preferences';

export default function Index() {
    const preferences = usePreferences();
    const currentProject = preferences.preferences.currentProject || {
        url: "asd",
        password: "asd",
        connected: true,
        mapSettings: {pointRadius:123},
    }
    
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
        {/* {currentProject ? <ProjectScreen /> : <Text>Project not found</Text> } */}
        <Text>Project not found</Text>
    </View>
  );
}
