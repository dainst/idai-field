import { Document, SyncStatus } from 'idai-field-core';
import { HStack, Icon, IconButton, View } from 'native-base';
import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import AppHeader from '../../components/AppHeader';
import Map from '../../components/Map/Map';
import SyncSettingsModal from '../../components/SyncSettingsModal';
import { DocumentRepository } from '../../repositories/document-repository';
import useSync from './use-sync';


interface HomeScreenProps {
    repository: DocumentRepository;
}


const HomeScreen: React.FC<HomeScreenProps> = ({ repository }): ReactElement => {
    
    const [showSyncSettings, setShowSyncSettings] = useState<boolean>(false);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [syncSettings, setSyncSettings, syncStatus] = useSync(repository);

    const issueSearch = useCallback(() => {

        repository.find({ q: '*' }).then(result => setDocuments(result.documents));
    }, [repository]);

    useEffect(() => { issueSearch(); }, [issueSearch]);

    return (
        <View flex={ 1 } safeArea>
            <AppHeader
                title={ syncSettings.project ? syncSettings.project : 'iDAI.field mobile' }
                right={ renderSyncSettingsButtons(
                    syncStatus,
                    setShowSyncSettings,
                    () => issueSearch()
                ) } />
            <View style={ styles.container }>
                <SyncSettingsModal
                    settings={ syncSettings }
                    setSettings={ (newSyncSettings) => {
                        setSyncSettings(newSyncSettings);
                        setShowSyncSettings(false);
                    } }
                    isOpen={ showSyncSettings }
                    onClose={ () => setShowSyncSettings(false) }
                />
                <Map geoDocuments={ documents.filter(doc => doc && doc.resource.geometry ? true : false) } />
            </View>
        </View>
    );
};


const renderSyncSettingsButtons = (
    syncStatus: SyncStatus,
    setShowSettings: React.Dispatch<React.SetStateAction<boolean>>,
    issueSearch: () => void
) => (

    <HStack>
        <IconButton
            onPress={ issueSearch }
            isDisabled={ syncStatus === SyncStatus.Offline ? false : true }
            icon={ <Icon type="Ionicons" name="refresh" color="white" /> }
        />
        <IconButton
            variant="ghost"
            icon={ getSyncStatusIcon(syncStatus) }
            onPress={ () => setShowSettings(true) } />
    </HStack>
);


const getSyncStatusIcon = (syncStatus: SyncStatus) => {
    
    switch (syncStatus) {
        case SyncStatus.Offline:
            return <Icon type="MaterialIcons" name="cloud-off" color="white" />;
        case SyncStatus.Pulling:
            return <Icon type="MaterialIcons" name="cloud-download" color="white" />;
        case SyncStatus.Pushing:
            return <Icon type="MaterialIcons" name="cloud-upload" color="white" />;
        case SyncStatus.InSync:
            return <Icon type="MaterialCommunityIcons" name="cloud-check" color="white" />;
        default:
            return <Icon type="MaterialCommunityIcons" name="cloud-alert" color="white" />;
    }
};


const styles = StyleSheet.create({
    container: {
        flex: 1
    }
});


export default HomeScreen;
