import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import AppLoading from 'expo-app-loading';
import * as Font from 'expo-font';
import { Root } from 'native-base';
import PouchDB from 'pouchdb-react-native';
import React, { Dispatch, ReactElement, SetStateAction, useState } from 'react';
import { enableScreens } from 'react-native-screens';
import PouchDbContextProvider from './src/data/pouchdb/PouchContextProvider';
import TabNavigator from './src/navigation/TabNavigator/TabNavigator';
import { DocumentRepository } from './src/repositories/document-repository';

enableScreens();


type SetDocumentRepository = Dispatch<SetStateAction<DocumentRepository | undefined>>;


export default function App(): ReactElement {

    const [documentRepository, setDocumentRepository] = useState<DocumentRepository>();
    const [finishedLoading, setFinishedLoading] = useState(false);

    if(!finishedLoading){
        return <AppLoading
                    startAsync={ initializeApp(setDocumentRepository) }
                    onFinish={ () => setFinishedLoading(true) }
                    onError={ (err) => console.log(err) } />;
    }

    return (
        <Root>
            <NavigationContainer>
                <PouchDbContextProvider>
                    <RootStackNavigator />
                </PouchDbContextProvider>
            </NavigationContainer>
        </Root>
    );
}


const initializeApp = (setDocumentRepository: SetDocumentRepository) => async () => {
    await Promise.all([
        fetchFonts(),
        setupRepository(setDocumentRepository)
    ]);
};


const fetchFonts = () => {
    return Font.loadAsync({
        Roboto: require('native-base/Fonts/Roboto.ttf'),
        Roboto_medium: require('native-base/Fonts/Roboto_medium.ttf'),
        ...Ionicons.font,
    });
};


const setupRepository = async (setDocumentRepository: SetDocumentRepository) => {
    const repository = await DocumentRepository.init('test', (name: string) => new PouchDB(name));
    setDocumentRepository(repository);
};
