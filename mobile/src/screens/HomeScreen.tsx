import { Document } from 'idai-field-core';
import { Button, Center, View } from 'native-base';
import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import AppHeader from '../components/AppHeader';
import Map from '../components/Map/Map';
import Settings from '../components/Settings';
import { SyncSettings } from '../model/sync-settings';
import { DocumentRepository } from '../repositories/document-repository';


interface HomeScreenProps {
    repository: DocumentRepository;
}


const HomeScreen: React.FC<HomeScreenProps> = ({ repository }): ReactElement => {
    
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [syncSettings, setSyncSettings] = useState<SyncSettings>({
        url: '', project: '', password: '', connected: false });
    const [documents, setDocuments] = useState<Document[]>([]);

    const issueSearch = useCallback(() => {

        repository.find({ q: '*' }).then(result => setDocuments(result.documents));
    }, [repository]);

    useEffect(() => {

        issueSearch();
    }, [issueSearch]);

    return (
        <View style={ styles.container }>
            <AppHeader title={ syncSettings ? syncSettings.project : 'iDAI field mobile' } />

            <Button onPress={ () => setShowSettings(current => !current) }>Settings</Button>
            <Center flex={ 1 } >
                { showSettings
                    ? <Settings
                        repository={ repository }
                        syncSettings={ syncSettings }
                        onSyncSettingsSet={ (syncSettings) => setSyncSettings(syncSettings) } />
                    : <>
                        <Button onPress={ () => issueSearch() }>Refresh</Button>
                        <Map geoDocuments={ documents.filter(doc => doc && doc.resource.geometry ? true : false) } />
                    </>
                }
            </Center>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});


export default HomeScreen;
