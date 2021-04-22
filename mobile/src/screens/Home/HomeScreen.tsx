import { Document, SyncStatus } from 'idai-field-core';
import { HStack, Icon, IconButton, View } from 'native-base';
import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import AppHeader from '../../components/AppHeader';
import Map from '../../components/Map/Map';
import Settings from '../../components/Settings';
import { DocumentRepository } from '../../repositories/document-repository';
import useSyncSettings from './use-sync-settings';


interface HomeScreenProps {
    repository: DocumentRepository;
}


const HomeScreen: React.FC<HomeScreenProps> = ({ repository }): ReactElement => {
    
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [syncSettings, setSyncSettings, syncStatus] = useSyncSettings(repository);

    const issueSearch = useCallback(() => {

        repository.find({ q: '*' }).then(result => setDocuments(result.documents));
    }, [repository]);

    useEffect(() => { issueSearch(); }, [issueSearch]);

    return (
        <View flex={ 1 } safeArea>
            <AppHeader
                title={ syncSettings.project ? syncSettings.project : 'iDAI.field mobile' }
                right={ renderSettingsButtons(
                    syncStatus,
                    setShowSettings,
                    () => issueSearch()
                ) } />
            <View style={ styles.container }>
                <Settings
                    settings={ syncSettings }
                    setSettings={ (newSyncSettings) => {
                        setSyncSettings(newSyncSettings);
                        setShowSettings(false);
                    } }
                    isOpen={ showSettings }
                    onClose={ () => setShowSettings(false) }
                />
                <Map geoDocuments={ documents.filter(doc => doc && doc.resource.geometry ? true : false) } />
            </View>
        </View>
    );
};


const renderSettingsButtons = (
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
