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

  if (!config) return <Text>프로젝트 설정을 불러오지 못했습니다.</Text>;
  return (
    <ConfigurationContext.Provider value={config}>
      <ProjectContextProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Drawer>
            <Drawer.Screen
              name="index"
              options={{
                drawerLabel: '기록 목록',
                title: '기록 목록',
              }}
            />
            <Drawer.Screen
              name="DocumentAdd"
              options={{
                drawerLabel: '기록 추가',
                title: '기록 추가',
              }}
            />
            <Drawer.Screen
              name="DocumentEdit"
              options={{
                drawerItemStyle: { display: 'none' },
                title: '기록 편집',
              }}
            />
            <Drawer.Screen
              name="DocumentsMap"
              options={{
                drawerLabel: '지도',
                title: '지도',
              }}
            />
          </Drawer>
        </GestureHandlerRootView>
      </ProjectContextProvider>
    </ConfigurationContext.Provider>
  );
}
