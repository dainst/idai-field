import { NavigationContainer, RouteProp } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import AppLoading from 'expo-app-loading';
import React, { ReactElement, useCallback } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import DocumentsScreen from './src/components/Documents/DocumentsScreen';
import HomeScreen from './src/components/Home/HomeScreen';
import SettingsScreen from './src/components/Settings/SettingsScreen';
import usePouchdbManager from './src/hooks/use-pouchdb-manager';
import usePreferences from './src/hooks/use-preferences';


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

    // TODO refactor
    const pouchdbManager = usePouchdbManager('');

    const deleteProject = useCallback(async (project: string) => {
    
        removeProject(project);
        await pouchdbManager?.destroyDb(project);
    }, [removeProject, pouchdbManager]);


    if (preferences) {
        return (
            <SafeAreaProvider>
                <NavigationContainer>
                    <Stack.Navigator initialRouteName="HomeScreen" screenOptions={ { headerShown: false } }>
                        <Stack.Screen name="HomeScreen">
                            { ({ navigation }) => <HomeScreen
                                preferences={ preferences }
                                setCurrentProject={ setCurrentProject }
                                deleteProject={ deleteProject }
                                navigate={ (screen: string) => navigation.navigate(screen) }
                            /> }
                        </Stack.Screen>
                        <Stack.Screen name="DocumentsScreen">
                            { () => <DocumentsScreen
                                preferences={ preferences }
                                setProjectSettings={ setProjectSettings }
                            /> }
                        </Stack.Screen>
                        <Stack.Screen name="SettingsScreen">
                            { (props) => <SettingsScreen { ... { ...props, preferences, setUsername } } /> }
                        </Stack.Screen>
                    </Stack.Navigator>
                </NavigationContainer>
            </SafeAreaProvider>
        );
    } else {
        return <AppLoading />;
    }
}
