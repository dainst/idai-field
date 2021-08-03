import { NavigationContainer, RouteProp } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import AppLoading from 'expo-app-loading';
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

export type AppStackParamList = {
    HomeScreen: undefined;
    ProjectScreen: undefined;
    SettingsScreen: undefined;
    LoadingScreen: undefined;
};


export type AppStackNavProps<T extends keyof AppStackParamList> = {
    navigation: StackNavigationProp<AppStackParamList, T>;
    route: RouteProp<AppStackParamList, T>;
};


enableScreens();


const Stack = createStackNavigator();


export default function App(): ReactElement {

    const preferences = usePreferences();

    // TODO refactor
    const pouchdbDatastore = usePouchdbDatastore('');

    const deleteProject = useCallback(async (project: string) => {
    
        preferences.removeProject(project);
        await pouchdbDatastore?.destroyDb(project);
    }, [preferences, pouchdbDatastore]);

    const initialRouteName = preferences.preferences.currentProject ? 'ProjectScreen' : 'HomeScreen';
  
    if (preferences && pouchdbDatastore) {
        return (
            <SafeAreaProvider>
                <PreferencesContext.Provider value={ preferences }>
                    <LabelsContextProvider>
                        <ToastProvider>
                            <NavigationContainer>
                                <Stack.Navigator
                                    initialRouteName={ initialRouteName }
                                    screenOptions={ { headerShown: false } }
                                >
                                    <Stack.Screen name="HomeScreen">
                                        { ({ navigation }) => <HomeScreen
                                            deleteProject={ deleteProject }
                                            navigate={ (screen: string) => navigation.navigate(screen) }
                                        /> }
                                    </Stack.Screen>
                                    <Stack.Screen name="ProjectScreen">
                                        { () => preferences.preferences.currentProject && <ProjectScreen /> }
                                    </Stack.Screen>
                                    <Stack.Screen name="SettingsScreen">
                                        { (props) => <SettingsScreen { ...props } /> }
                                    </Stack.Screen>
                                    <Stack.Screen name="LoadingScreen">
                                        { ({ navigation }) => preferences.preferences.currentProject && <LoadingScreen
                                            navigation={ navigation }
                                        /> }
                                    </Stack.Screen>
                                </Stack.Navigator>
                            </NavigationContainer>
                            <Toast />
                        </ToastProvider>
                    </LabelsContextProvider>
                </PreferencesContext.Provider>
            </SafeAreaProvider>
        );
    } else {
        return <AppLoading />;
    }
}
