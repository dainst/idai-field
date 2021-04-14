import PouchDB from 'pouchdb-react-native';
import React, { Dispatch, ReactElement, SetStateAction, useState } from 'react';
import { enableScreens } from 'react-native-screens';
import PouchDbContextProvider from './src/data/pouchdb/PouchContextProvider';
import { DocumentRepository } from './src/repositories/document-repository';
import { NativeBaseProvider } from 'native-base';
import HomeScreen from './src/screens/HomeScreen';
import AppLoading from 'expo-app-loading';

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
        <NativeBaseProvider>
            <PouchDbContextProvider>
                <HomeScreen />
            </PouchDbContextProvider>
        </NativeBaseProvider>
    );
}


const initializeApp = (setDocumentRepository: SetDocumentRepository) => async () => {
    await setupRepository(setDocumentRepository);

};


const setupRepository = async (setDocumentRepository: SetDocumentRepository) => {
    const repository = await DocumentRepository.init('test', (name: string) => new PouchDB(name));
    setDocumentRepository(repository);
};
