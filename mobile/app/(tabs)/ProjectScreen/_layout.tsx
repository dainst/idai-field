import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { useContext, useEffect, useState } from 'react';
import { PreferencesContext } from '@/contexts/preferences-context';
import usePouchDbDatastore from '@/hooks/use-pouchdb-datastore';
import useConfiguration from '@/hooks/use-configuration';

import { ConfigurationContext } from '@/contexts/configuration-context';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ProjectContextProvider } from '@/contexts/project-context';
import { MaterialIcons } from '@expo/vector-icons';

export default function Layout() {
  const { preferences } = useContext(PreferencesContext);
  const [isTakingLong, setIsTakingLong] = useState(false);

  const pouchdbDatastore = usePouchDbDatastore(preferences.currentProject);

  const config = useConfiguration(
    preferences.currentProject,
    preferences.languages,
    preferences.username,
    pouchdbDatastore
  );

  useEffect(() => {
    if (config) {
      setIsTakingLong(false);
      return;
    }

    const timeoutId = setTimeout(() => setIsTakingLong(true), 1400);

    return () => clearTimeout(timeoutId);
  }, [config, preferences.currentProject]);

  if (!config) {
    return (
      <ProjectConfigurationLoadingState
        projectName={preferences.currentProject}
        isTakingLong={isTakingLong}
      />
    );
  }

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

const ProjectConfigurationLoadingState = ({
  projectName,
  isTakingLong,
}: {
  projectName?: string;
  isTakingLong: boolean;
}) => (
  <View style={styles.loadingContainer}>
    <View style={styles.logoMark}>
      <MaterialIcons name="edit-note" size={42} color="#2f5f4a" />
    </View>
    <Text style={styles.loadingTitle}>현장 기록</Text>
    <ActivityIndicator
      color="#2f5f4a"
      size="small"
      style={styles.loadingSpinner}
    />
    <Text style={styles.loadingText}>
      {projectName
        ? `${projectName} 설정을 불러오는 중입니다.`
        : '프로젝트 설정을 불러오는 중입니다.'}
    </Text>
    {isTakingLong && (
      <Text style={styles.loadingHint}>
        저장소와 분류 설정을 확인하고 있습니다.
      </Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: '#f7faf8',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: '#e8f5ed',
    borderColor: '#b7dfc4',
    borderRadius: 18,
    borderWidth: 1,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  loadingTitle: {
    color: '#20313a',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 18,
  },
  loadingSpinner: {
    marginTop: 14,
  },
  loadingText: {
    color: '#526272',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 12,
    textAlign: 'center',
  },
  loadingHint: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    textAlign: 'center',
  },
});
