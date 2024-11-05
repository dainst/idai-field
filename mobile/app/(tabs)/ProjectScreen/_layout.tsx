import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { useContext } from 'react';
import { PreferencesContext } from '@/contexts/preferences-context';
import usePouchDbDatastore from '@/hooks/use-pouchdb-datastore';
import useConfiguration from '@/hooks/use-configuration';
import useRepository from '@/hooks/use-repository';
import { ConfigurationContext } from '@/contexts/configuration-context';

export default function Layout() {
  const preferences = useContext(PreferencesContext);
  const pouchdbDatastore = usePouchDbDatastore(
    preferences.preferences.currentProject
  );

  const config = useConfiguration(
    preferences.preferences.currentProject,
    preferences.preferences.languages,
    preferences.preferences.username,
    pouchdbDatastore
  );

  if (!config) return;
  return (
    <ConfigurationContext.Provider value={config}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Drawer>
          <Drawer.Screen
            name="index"
            options={{
              drawerLabel: 'Home',
              title: 'overview',
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
            name="DocumentsList"
            options={{
              drawerLabel: 'Documents List',
              title: 'Documents List',
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
    </ConfigurationContext.Provider>
  );
}
