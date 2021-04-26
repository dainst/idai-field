import { NavigationContainer, RouteProp } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import AppLoading from 'expo-app-loading';
import { NativeBaseProvider } from 'native-base';
import PouchDB from 'pouchdb-react-native';
import React, { Dispatch, ReactElement, SetStateAction, useState } from 'react';
import { enableScreens } from 'react-native-screens';
import { DocumentRepository } from './src/repositories/document-repository';
import DocumentsScreen from './src/screens/DocumentsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SplashScreen from './src/screens/SplashScreen';


export type AppStackParamList = {
    SplashScreen: undefined;
    DocumentsScreen: undefined;
    SettingsScreen: undefined;
};


export type AppStackNavProps<T extends keyof AppStackParamList> = {
    navigation: StackNavigationProp<AppStackParamList, T>;
    route: RouteProp<AppStackParamList, T>;
};


type SetDocumentRepository = Dispatch<SetStateAction<DocumentRepository | undefined>>;


enableScreens();


const Stack = createStackNavigator();


export default function App(): ReactElement {

    const [repository, setRepository] = useState<DocumentRepository>();
    const [finishedLoading, setFinishedLoading] = useState(false);

    if (!finishedLoading || !repository) {
        return <AppLoading
                    startAsync={ initializeApp(setRepository) }
                    onFinish={ () => setFinishedLoading(true) }
                    onError={ (err) => console.log(err) } />;
    }

    return (
        <NativeBaseProvider>
            <NavigationContainer>
                <Stack.Navigator initialRouteName="SplashScreen" screenOptions={ { headerShown: false } }>
                    <Stack.Screen name="SplashScreen">
                        { (props) => <SplashScreen { ...props } /> }
                    </Stack.Screen>
                    <Stack.Screen name="DocumentsScreen">
                        { () => <DocumentsScreen repository={ repository } /> }
                    </Stack.Screen>
                    <Stack.Screen name="SettingsScreen">
                        { () => <SettingsScreen /> }
                    </Stack.Screen>
                </Stack.Navigator>
            </NavigationContainer>
        </NativeBaseProvider>
    );
}


const initializeApp = (setDocumentRepository: SetDocumentRepository) => async () => {
    await setupRepository(setDocumentRepository);

};


const setupRepository = async (setDocumentRepository: SetDocumentRepository) => {
    const repository = await DocumentRepository.init('test', (name: string) => new PouchDB(name), 'testuser');
    setDocumentRepository(repository);
};
