import { NavigationContainer } from '@react-navigation/native';
import AppLoading from 'expo-app-loading';
import { NativeBaseProvider } from 'native-base';
import PouchDB from 'pouchdb-react-native';
import React, { Dispatch, ReactElement, SetStateAction, useState } from 'react';
import { enableScreens } from 'react-native-screens';
import { DocumentRepository } from './src/repositories/document-repository';
import DocumentsScreen from './src/screens/DocumentsScreen';

enableScreens();

type SetDocumentRepository = Dispatch<SetStateAction<DocumentRepository | undefined>>;


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
                <DocumentsScreen repository={ repository } />
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
