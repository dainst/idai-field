import { Document, SyncProcess, SyncStatus } from 'idai-field-core';
import { HStack, Icon, IconButton, View } from 'native-base';
import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Subscription } from 'rxjs';
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
    const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.Offline);
    const [syncStatusSubscription, setSyncStatusSubscription] = useState<Subscription>();
    const [documents, setDocuments] = useState<Document[]>([]);

    const issueSearch = useCallback(() => {

        repository.find({ q: '*' }).then(result => setDocuments(result.documents));
    }, [repository]);

    const onSyncSettingsSet = (syncSettings: SyncSettings, syncProcess?: SyncProcess) => {

        setShowSettings(false);

        setSyncSettings(syncSettings);
        if (syncProcess) {
            const sub = syncProcess.observer.subscribe(
                status => setSyncStatus(status),
                err => setSyncStatus(err)
            );
            setSyncStatusSubscription(sub);
        } else {
            setSyncStatus(SyncStatus.Offline);
            syncStatusSubscription?.unsubscribe();
            setSyncStatusSubscription(undefined);
        }
    };

    useEffect(() => {

        issueSearch();
    }, [issueSearch]);

    return (
        <View flex={ 1 } safeArea>
            <AppHeader
                title={ syncSettings.project ? syncSettings.project : 'iDAI.field mobile' }
                right={ renderSettingsButtons(syncStatus, setShowSettings, () => issueSearch(), syncSettings) } />
            <View style={ styles.container }>
                <Settings
                    repository={ repository }
                    syncSettings={ syncSettings }
                    onSyncSettingsSet={ onSyncSettingsSet }
                    isOpen={ showSettings }
                    onClose={ () => setShowSettings(current => !current) }
                />
                <Map geoDocuments={ documents.filter(doc => doc && doc.resource.geometry ? true : false) } />
            </View>
        </View>
    );
};


const renderSettingsButtons = (
    syncStatus: SyncStatus,
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
            icon={ getSyncStatusIcon(syncStatus) }
            onPress={ () => setShowSettings(current => !current) } />
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
