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
import usePouchdbManager from './src/hooks/use-pouchdb-manager';
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

    const {
        preferences,
        setCurrentProject,
        setUsername,
        setProjectSettings,
        removeProject,
    } = usePreferences();

    // TODO refactor
    const pouchdbManager = usePouchdbManager('');

    const deleteProject = useCallback(async (project: string) => {
    
        removeProject(project);
        await pouchdbManager?.destroyDb(project);
    }, [removeProject, pouchdbManager]);


    if (preferences) {
        return (
            <SafeAreaProvider>
                <ToastProvider>
                    <NavigationContainer>
                        <Stack.Navigator
                            initialRouteName={ preferences.currentProject ? 'ProjectScreen' : 'HomeScreen' }
                            screenOptions={ { headerShown: false } }
                        >
                            <Stack.Screen name="HomeScreen">
                                { ({ navigation }) => <HomeScreen
                                    preferences={ preferences }
                                    setCurrentProject={ setCurrentProject }
                                    setProjectSettings={ setProjectSettings }
                                    deleteProject={ deleteProject }
                                    navigate={ (screen: string) => navigation.navigate(screen) }
                                /> }
                            </Stack.Screen>
                            <Stack.Screen name="ProjectScreen">
                                { () => preferences.currentProject && <ProjectScreen
                                    currentProject={ preferences.currentProject }
                                    preferences={ preferences }
                                    setProjectSettings={ setProjectSettings }
                                /> }
                            </Stack.Screen>
                            <Stack.Screen name="SettingsScreen">
                                { (props) => <SettingsScreen { ... { ...props, preferences, setUsername } } /> }
                            </Stack.Screen>
                            <Stack.Screen name="LoadingScreen">
                                { ({ navigation }) => preferences.currentProject && <LoadingScreen
                                    currentProject={ preferences.currentProject }
                                    preferences={ preferences }
                                    removeProject={ removeProject }
                                    setProjectSettings={ setProjectSettings }
                                    navigation={ navigation }
                                /> }
                            </Stack.Screen>
                        </Stack.Navigator>
                    </NavigationContainer>
                    <Toast />
                </ToastProvider>
            </SafeAreaProvider>
        );
    } else {
        return <AppLoading />;
    }
}
