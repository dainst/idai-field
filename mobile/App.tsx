import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, RouteProp } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { NativeBaseProvider } from 'native-base';
import PouchDB from 'pouchdb-react-native';
import React, { Dispatch, ReactElement, SetStateAction, useEffect, useState } from 'react';
import { enableScreens } from 'react-native-screens';
import { update } from 'tsfun';
import useSync from './src/hooks/use-sync';
import { Settings, SyncSettings } from './src/model/settings';
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


interface Preferences {
    settings: Settings;
    syncSettings: SyncSettings;
    recentProjects: string[];
}


type SetRepository = Dispatch<SetStateAction<DocumentRepository | undefined>>;


enableScreens();


const Stack = createStackNavigator();


export default function App(): ReactElement {

    const [repository, setRepository] = useState<DocumentRepository>();
    const [settings, setSettings] = useState<Settings>(getDefaultSettings());
    const [syncSettings, setSyncSettings] = useState<SyncSettings>(getDefaultSyncSettings());
    const [recentProjects, setRecentProjects] = useState<string[]>([]);
    const syncStatus = useSync(settings.project, syncSettings, repository);

    useEffect(() => {

        (async () => {
            const preferences = await loadPreferences();
            if (preferences) {
                setSettings(preferences.settings);
                setSyncSettings(preferences.syncSettings);
                setRecentProjects(preferences.recentProjects);
            }
        })();
    }, []);

    useEffect(() => {

        setSyncSettings(old => update('connected', false, old));
        setupRepository(settings.project, settings.username, setRepository);
    }, [settings]);

    useEffect(() => {

        savePreferences({ settings, syncSettings, recentProjects });
    }, [settings, syncSettings, recentProjects]);


    return (
        <NativeBaseProvider>
            <NavigationContainer>
                <Stack.Navigator initialRouteName="HomeScreen" screenOptions={ { headerShown: false } }>
                    <Stack.Screen name="HomeScreen">
                        { (props) => <HomeScreen { ... {
                            ...props, settings, recentProjects, setRecentProjects, setSettings
                        } } /> }
                    </Stack.Screen>
                    <Stack.Screen name="DocumentsScreen">
                        { () => <DocumentsScreen { ... { repository, syncStatus, syncSettings, setSyncSettings } } /> }
                    </Stack.Screen>
                    <Stack.Screen name="SettingsScreen">
                        { (props) => <SettingsScreen { ... { ...props, settings, setSettings } } /> }
                    </Stack.Screen>
                </Stack.Navigator>
            </NavigationContainer>
        </NativeBaseProvider>
    );
}


const loadPreferences = async (): Promise<Preferences | null> => {

    const prefString = await AsyncStorage.getItem('preferences');
    return prefString ? JSON.parse(prefString) : null;
};


const savePreferences = async (preferences: Preferences) =>
    await AsyncStorage.setItem('preferences', JSON.stringify(preferences));


const setupRepository = async (project: string, username: string, setRepository: SetRepository) => {

    const repository = await DocumentRepository.init(project, (name: string) => new PouchDB(name), username);
    setRepository(repository);
};


const getDefaultSettings = () => ({
    project: 'test467',
    username: ''
});


const getDefaultSyncSettings = () => ({
    url: '',
    password: '',
    connected: false
});
