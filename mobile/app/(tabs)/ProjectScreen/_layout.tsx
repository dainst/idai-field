import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { useContext } from 'react';
import { PreferencesContext } from '@/contexts/preferences-context';
import usePouchDbDatastore from '@/hooks/use-pouchdb-datastore';
import useConfiguration from '@/hooks/use-configuration';

import { ConfigurationContext } from '@/contexts/configuration-context';
import { Text } from 'react-native';
import { ProjectContextProvider } from '@/contexts/project-context';

export default function Layout() {
  const { preferences } = useContext(PreferencesContext);

  const pouchdbDatastore = usePouchDbDatastore(preferences.currentProject);

  const config = useConfiguration(
    preferences.currentProject,
    preferences.languages,
    preferences.username,
    pouchdbDatastore
  );

  if (!config) return <Text>Could not load project configuration</Text>;
  return (
    <ConfigurationContext.Provider value={config}>
      <ProjectContextProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Drawer>
            <Drawer.Screen
              name="index"
              options={{
                drawerLabel: 'Document List',
                title: 'Document List',
              }}
            />
            <Drawer.Screen
              name="DocumentAdd"
              options={{
                drawerLabel: 'Add Document',
                title: 'Add Document',
              }}
            />
            <Drawer.Screen
              name="DocumentsMap"
              options={{
                drawerLabel: 'Documents Map',
                title: 'Documents Map',
              }}
            />
          </Drawer>
        </GestureHandlerRootView>
      </ProjectContextProvider>
    </ConfigurationContext.Provider>
  );
}
