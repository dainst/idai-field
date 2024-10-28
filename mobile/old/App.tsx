import {
  BottomTabNavigationProp,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { NavigationContainer, RouteProp } from '@react-navigation/native';
// import AppLoading from 'expo-app-loading';
import * as SplashScreen from 'expo-splash-screen';
import React, { ReactElement, useCallback } from 'react';
import 'react-native-get-random-values';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { Toast } from './src/components/common/Toast/Toast';
import { ToastProvider } from './src/components/common/Toast/ToastProvider';
import HomeScreen from './src/components/Home/HomeScreen';
import LoadingScreen from './src/components/Loading/LoadingScreen';
import ProjectScreen from './src/components/Project/ProjectScreen';
import SettingsScreen from './src/components/Settings/SettingsScreen';
import LabelsContextProvider from './src/contexts/labels/LabelsContextProvider';
import { PreferencesContext } from './src/contexts/preferences-context';
import usePouchdbDatastore from './src/hooks/use-pouchdb-datastore';
import usePreferences from './src/hooks/use-preferences';

export type AppParamList = {
  HomeScreen: undefined;
  ProjectScreen: undefined;
  SettingsScreen: undefined;
  LoadingScreen: undefined;
};

export type AppNavProps<T extends keyof AppParamList> = {
  navigation: BottomTabNavigationProp<AppParamList, T>;
  route: RouteProp<AppParamList, T>;
};

// SplashScreen.preventAutoHideAsync();

enableScreens();

const Tab = createBottomTabNavigator();

export default function App(): ReactElement {
  const preferences = usePreferences();

  // TODO refactor
  const pouchdbDatastore = usePouchdbDatastore('');

  const deleteProject = useCallback(
    async (project: string) => {
      preferences.removeProject(project);
      await pouchdbDatastore?.destroyDb(project);
    },
    [preferences, pouchdbDatastore]
  );

  const initialRouteName = preferences.preferences.currentProject
    ? 'ProjectScreen'
    : 'HomeScreen';

  const appIsReady = preferences && pouchdbDatastore;

  //   const onLayoutRootView = useCallback(async () => {
  //     if (appIsReady) {
  //       // This tells the splash screen to hide immediately! If we call this after
  //       // `setAppIsReady`, then we may see a blank screen while the app is
  //       // loading its initial state and rendering its first pixels. So instead,
  //       // we hide the splash screen once we know the root view has already
  //       // performed layout.

  //     }
  //   }, [appIsReady]);

  if (appIsReady) {
    return (
      <SafeAreaProvider>
        <PreferencesContext.Provider value={preferences}>
          <LabelsContextProvider>
            <ToastProvider>
              <NavigationContainer>
                <Tab.Navigator
                  initialRouteName={initialRouteName}
                  screenOptions={{ unmountOnBlur: true, tabBarVisible: false }}
                >
                  {/* <Tab.Screen name="HomeScreen">
                    {({ navigation }) => (
                      <HomeScreen
                        deleteProject={deleteProject}
                        navigate={(screen: string) =>
                          navigation.navigate(screen)
                        }
                      />
                    )}
                  </Tab.Screen> */}
                  <Tab.Screen name="ProjectScreen">
                    {() =>
                      preferences.preferences.currentProject && (
                        <ProjectScreen />
                      )
                    }
                  </Tab.Screen>
                  {/* <Tab.Screen name="SettingsScreen">
                    {(props) => <SettingsScreen {...props} />}
                  </Tab.Screen> */}
                  <Tab.Screen name="LoadingScreen">
                    {({ navigation }) =>
                      preferences.preferences.currentProject && (
                        <LoadingScreen navigation={navigation} />
                      )
                    }
                  </Tab.Screen>
                </Tab.Navigator>
              </NavigationContainer>
              <Toast />
            </ToastProvider>
          </LabelsContextProvider>
        </PreferencesContext.Provider>
      </SafeAreaProvider>
    );
  } else {
    return null;
  }
}
