import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Document } from 'idai-field-core';
import { useToast, View } from 'native-base';
import React, { ReactElement, SetStateAction, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { update } from 'tsfun';
import Map from '../components/Map/Map';
import ScanBarcodeButton from '../components/ScanBarcodeButton';
import SearchBar from '../components/SearchBar';
import useSync from '../hooks/use-sync';
import { Settings, SyncSettings } from '../model/settings';
import { DocumentRepository } from '../repositories/document-repository';
import { DocumentsContainerDrawerParamList } from './DocumentsContainer';


interface DocumentsMapProps {
    repository: DocumentRepository;
    documents: Document[];
    allDocuments: Document[];
    issueSearch: (q: string) => void;
    navigation: DrawerNavigationProp<DocumentsContainerDrawerParamList, 'DocumentsMap'>;
    selectedDocument?: Document;
    settings: Settings;
    setSettings: React.Dispatch<SetStateAction<Settings>>;
}


const DocumentsMap: React.FC<DocumentsMapProps> = ({
    repository,
    navigation,
    documents,
    allDocuments,
    settings,
    setSettings,
    issueSearch
}): ReactElement => {

    const syncStatus = useSync(repository, settings);
    const toast = useToast();

    const toggleDrawer = useCallback(() => navigation.toggleDrawer(), [navigation]);

    const setSyncSettings = (syncSettings: SyncSettings) =>
        setSettings(oldSettings => update('sync', syncSettings, oldSettings));

    const onBarCodeScanned = useCallback((data: string) => {

        repository.find({ constraints: { 'identifier:match': data } })
            .then(({ documents: [doc] }) =>
                navigation.navigate('DocumentDetails', { docId: doc.resource.id })
            )
            .catch(() => toast({ title: `Resource  '${data}' not found`, position: 'center' }));
    }, [repository, navigation, toast]);
        

    return (
        <View flex={ 1 } safeArea>
            <SearchBar { ...{ issueSearch, syncSettings: settings.sync, setSyncSettings, syncStatus, toggleDrawer } } />
            <View style={ styles.container }>
                <Map
                    selectedGeoDocuments={ documents.filter(doc => doc?.resource.geometry) }
                    geoDocuments={ allDocuments.filter(doc => doc?.resource.geometry) } />
            </View>
            <ScanBarcodeButton onBarCodeScanned={ onBarCodeScanned } />
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    input: {
        backgroundColor: 'white',
    }
});


export default DocumentsMap;
