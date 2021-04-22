import { Document, SyncStatus } from 'idai-field-core';
import { HStack, Icon, IconButton, View } from 'native-base';
import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import AppHeader from '../../components/AppHeader';
import Map from '../../components/Map/Map';
import SyncSettingsButton from '../../components/Sync/SyncSettingsButton';
import { SyncSettings } from '../../model/sync-settings';
import { DocumentRepository } from '../../repositories/document-repository';
import useSync from './use-sync';


interface HomeScreenProps {
    repository: DocumentRepository;
}


const HomeScreen: React.FC<HomeScreenProps> = ({ repository }): ReactElement => {
    
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
                right={ renderHeaderButtons(() => issueSearch(), syncSettings, setSyncSettings, syncStatus) } />
            <View style={ styles.container }>
                <Map geoDocuments={ documents.filter(doc => doc && doc.resource.geometry ? true : false) } />
            </View>
        </View>
    );
};


const renderHeaderButtons = (
    issueSearch: () => void,
    syncSettings: SyncSettings,
    setSyncSettings: (settings: SyncSettings) => void,
    syncStatus: SyncStatus
) =>
    
<HStack>
    <IconButton
        onPress={ issueSearch }
        isDisabled={ syncStatus === SyncStatus.Offline ? true : false }
        icon={ <Icon type="Ionicons" name="refresh" color="white" /> }
    />
    <SyncSettingsButton
        settings={ syncSettings }
        setSyncSettings={ setSyncSettings }
        status={ syncStatus }
    />
</HStack>;


const styles = StyleSheet.create({
    container: {
        flex: 1
    }
});


export default HomeScreen;
