import { NavigationContainer, RouteProp } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { NativeBaseProvider } from 'native-base';
import React, { ReactElement, useCallback } from 'react';
import { enableScreens } from 'react-native-screens';
import usePreferences from './src/hooks/use-preferences';
import useRepository from './src/hooks/use-repository';
import useSync from './src/hooks/use-sync';
import DocumentsScreen from './src/screens/DocumentsScreen';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';


export type AppStackParamList = {
    SplashScreen: undefined;
    DocumentsScreen: undefined;
    SettingsScreen: undefined;
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

    const repository = useRepository(preferences.currentProject, preferences.username);

    const syncStatus = useSync(
        preferences.currentProject,
        preferences.projects[preferences.currentProject],
        repository
    );


    const deleteProject = useCallback(async (project: string) => {
    
        removeProject(project);
        await repository?.destroy(project);
    }, [removeProject, repository]);


    return (
        <NativeBaseProvider>
            <NavigationContainer>
                <Stack.Navigator initialRouteName="HomeScreen" screenOptions={ { headerShown: false } }>
                    <Stack.Screen name="HomeScreen">
                        { (props) => <HomeScreen
                            { ...props }
                            preferences={ preferences }
                            setCurrentProject={ setCurrentProject }
                            deleteProject={ deleteProject }
                        /> }
                    </Stack.Screen>
                    <Stack.Screen name="DocumentsScreen">
                        { () => <DocumentsScreen
                            repository={ repository }
                            syncStatus={ syncStatus }
                            projectSettings={ preferences.projects[preferences.currentProject] }
                            setProjectSettings={ setProjectSettings }
                        /> }
                    </Stack.Screen>
                    <Stack.Screen name="SettingsScreen">
                        { (props) => <SettingsScreen { ... { ...props, preferences, setUsername } } /> }
                    </Stack.Screen>
                </Stack.Navigator>
            </NavigationContainer>
        </NativeBaseProvider>
    );
}
