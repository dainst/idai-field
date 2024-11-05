import { Text } from 'react-native';
import usePreferences from '@/hooks/use-preferences';
import { SafeAreaView } from 'react-native-safe-area-context';
import usePouchDbDatastore from '@/hooks/use-pouchdb-datastore';
import ProjectScreen from '@/components/Project/ProjectScreen';

export default function Index() {
  const preferences = usePreferences();
  const pouchdbDatastore = usePouchDbDatastore('');
  
  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {preferences.preferences.currentProject && pouchdbDatastore ? <ProjectScreen /> : <Text>Project not found</Text> }
    </SafeAreaView>
  );
}
