import { Text } from 'react-native';
import usePreferences from '@/old/src/hooks/use-preferences';
import { SafeAreaView } from 'react-native-safe-area-context';
import usePouchDbDatastore from '@/old/src/hooks/use-pouchdb-datastore';
import ProjectScreen from '@/old/src/components/Project/ProjectScreen';

export default function Index() {
  const preferences = usePreferences();
  const pouchdbDatastore = usePouchDbDatastore('');
  console.log(preferences.preferences.currentProject)
  console.log(pouchdbDatastore)
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
