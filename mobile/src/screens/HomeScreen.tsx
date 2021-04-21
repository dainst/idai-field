import { Document } from 'idai-field-core';
import { HStack, Icon, IconButton, View } from 'native-base';
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
        <View flex={ 1 } safeArea>
            <AppHeader
                title={ syncSettings.project ? syncSettings.project : 'iDAI.field mobile' }
                right={ renderSettingsButton(setShowSettings, () => issueSearch(), syncSettings) } />
            <View style={ styles.container }>
                <Settings
                    repository={ repository }
                    syncSettings={ syncSettings }
                    onSyncSettingsSet={ (syncSettings) => setSyncSettings(syncSettings) }
                    isOpen={ showSettings }
                    onClose={ () => setShowSettings(current => !current) }
                />
                <Map geoDocuments={ documents.filter(doc => doc && doc.resource.geometry ? true : false) } />
            </View>
        </View>
    );
};


const renderSettingsButton = (
    setShowSettings: React.Dispatch<React.SetStateAction<boolean>>,
    issueSearch: () => void, syncSettings: SyncSettings) => (
        <HStack>
            <IconButton
                onPress={ issueSearch }
                isDisabled={ syncSettings.connected ? false : true }
                icon={ <Icon type="Ionicons" name="refresh" color="white" /> }
            />
            <IconButton
                variant="ghost"
                icon={ <Icon type="Ionicons" name="settings" color="white" /> }
                onPress={ () => setShowSettings(current => !current) } />
        </HStack>);


const styles = StyleSheet.create({
    container: {
        flex: 1
    }
});


export default HomeScreen;
