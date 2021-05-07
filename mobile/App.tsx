import { NavigationContainer, RouteProp } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { NativeBaseProvider } from 'native-base';
import React, { ReactElement, useCallback } from 'react';
import { enableScreens } from 'react-native-screens';
import DocumentsScreen from './src/components/Documents/DocumentsScreen';
import HomeScreen from './src/components/Home/HomeScreen';
import SettingsScreen from './src/components/Settings/SettingsScreen';
import useConfiguration from './src/hooks/use-configuration';
import usePouchdbManager from './src/hooks/use-pouchdb-manager';
import usePreferences from './src/hooks/use-preferences';
import useRepository from './src/hooks/use-repository';
import useSync from './src/hooks/use-sync';


export type AppStackParamList = {
    HomeScreen: undefined;
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

    const pouchdbManager = usePouchdbManager(preferences.currentProject);

    const config = useConfiguration(
        preferences.currentProject,
        preferences.languages,
        preferences.username,
        pouchdbManager,
    );

    const repository = useRepository(
        preferences.currentProject,
        preferences.username,
        config?.getCategoryForest() || [],
        pouchdbManager,
    );

    const syncStatus = useSync(
        preferences.currentProject,
        preferences.projects[preferences.currentProject],
        repository,
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
                            config={ config }
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
