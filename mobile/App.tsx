import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, RouteProp } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { NativeBaseProvider } from 'native-base';
import PouchDB from 'pouchdb-react-native';
import React, { Dispatch, ReactElement, SetStateAction, useEffect, useState } from 'react';
import { enableScreens } from 'react-native-screens';
import { update } from 'tsfun';
import useSync from './src/hooks/use-sync';
import { Preferences } from './src/model/preferences';
import { DocumentRepository } from './src/repositories/document-repository';
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


type SetRepository = Dispatch<SetStateAction<DocumentRepository | undefined>>;


enableScreens();


const Stack = createStackNavigator();


export default function App(): ReactElement {

    const [repository, setRepository] = useState<DocumentRepository>();
    const [preferences, setPreferences] = useState<Preferences>(getDefaultPreferences());
    const syncStatus = useSync(preferences.settings.project, preferences.syncSettings, repository);

    useEffect(() => {

        loadPreferences().then(setPreferences);
    }, []);

    useEffect(() => {

        setPreferences(old => update(['syncSettings','connected'], false, old));
        setupRepository(preferences.settings.project, preferences.settings.username, setRepository);
    }, [preferences.settings]);

    useEffect(() => {

        savePreferences(preferences);
    }, [preferences]);


    return (
        <NativeBaseProvider>
            <NavigationContainer>
                <Stack.Navigator initialRouteName="HomeScreen" screenOptions={ { headerShown: false } }>
                    <Stack.Screen name="HomeScreen">
                        { (props) => <HomeScreen { ... { ...props, preferences, setPreferences } } /> }
                    </Stack.Screen>
                    <Stack.Screen name="DocumentsScreen">
                        { () => <DocumentsScreen { ... { repository, syncStatus, preferences, setPreferences } } /> }
                    </Stack.Screen>
                    <Stack.Screen name="SettingsScreen">
                        { (props) => <SettingsScreen { ... { ...props, preferences, setPreferences } } /> }
                    </Stack.Screen>
                </Stack.Navigator>
            </NavigationContainer>
        </NativeBaseProvider>
    );
}


const loadPreferences = async (): Promise<Preferences> => {

    const prefString = await AsyncStorage.getItem('preferences');
    return prefString ? JSON.parse(prefString) : getDefaultPreferences();
};


const savePreferences = async (preferences: Preferences) =>
    await AsyncStorage.setItem('preferences', JSON.stringify(preferences));


const setupRepository = async (project: string, username: string, setRepository: SetRepository) => {

    const repository = await DocumentRepository.init(project, (name: string) => new PouchDB(name), username);
    setRepository(repository);
};


const getDefaultPreferences = () => ({
    settings: {
        project: 'test467',
        username: ''
    },
    syncSettings: {
        url: '',
        password: '',
        connected: false
    },
    recentProjects: []
});
