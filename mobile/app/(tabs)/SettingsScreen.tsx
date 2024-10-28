import { Text, View } from 'react-native';
import ProjectScreen from '@/old/src/components/Project/ProjectScreen';
import SettingsScreen from '@/old/src/components/Settings/SettingsScreen';

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <SettingsScreen navigation={{goBack:()=>null}}/>
    </View>
  );
}
