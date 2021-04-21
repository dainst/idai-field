import { Document } from 'idai-field-core';
import { Icon, IconButton, View } from 'native-base';
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
                right={ renderSettingsButton(setShowSettings) } />
            <View style={ styles.container }>
                <Settings
                    repository={ repository }
                    syncSettings={ syncSettings }
                    onSyncSettingsSet={ (syncSettings) => setSyncSettings(syncSettings) }
                    isOpen={ showSettings }
                    onClose={ () => setShowSettings(current => !current) }
                />
                    <>
                    <IconButton
                        onPress={ () => issueSearch() }
                        icon={ <Icon type="Ionicons" name="refresh" color="black" /> }
                        style={ styles.refreshBtn } />
                    <Map geoDocuments={ documents.filter(doc => doc && doc.resource.geometry ? true : false) } />
                </>
            </View>
        </View>
    );
};


const renderSettingsButton = (setShowSettings: React.Dispatch<React.SetStateAction<boolean>>) =>
    <IconButton
        variant="ghost"
        icon={ <Icon type="Ionicons" name="settings" color="white" /> }
        onPress={ () => setShowSettings(current => !current) }>Settings</IconButton>;


const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    refreshBtn: {
        position: 'absolute',
        top: 5,
        left: 8
    }
});


export default HomeScreen;
