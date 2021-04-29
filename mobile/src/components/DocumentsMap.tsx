import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Document, SyncStatus } from 'idai-field-core';
import { useToast, View } from 'native-base';
import React, { ReactElement, SetStateAction, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Map from '../components/Map/Map';
import ScanBarcodeButton from '../components/ScanBarcodeButton';
import SearchBar from '../components/SearchBar';
import { SyncSettings } from '../model/settings';
import { DocumentRepository } from '../repositories/document-repository';
import { DocumentsContainerDrawerParamList } from './DocumentsContainer';


interface DocumentsMapProps {
    navigation: DrawerNavigationProp<DocumentsContainerDrawerParamList, 'DocumentsMap'>;
    repository: DocumentRepository;
    documents: Document[];
    allDocuments: Document[];
    selectedDocument?: Document;
    syncStatus: SyncStatus;
    syncSettings: SyncSettings;
    setSyncSettings: React.Dispatch<SetStateAction<SyncSettings>>;
    issueSearch: (q: string) => void;
}


const DocumentsMap: React.FC<DocumentsMapProps> = ({
    navigation,
    repository,
    documents,
    allDocuments,
    syncStatus,
    syncSettings,
    setSyncSettings,
    issueSearch
}): ReactElement => {

    const toast = useToast();

    const toggleDrawer = useCallback(() => navigation.toggleDrawer(), [navigation]);

    const onBarCodeScanned = useCallback((data: string) => {

        repository.find({ constraints: { 'identifier:match': data } })
            .then(({ documents: [doc] }) =>
                navigation.navigate('DocumentDetails', { docId: doc.resource.id })
            )
            .catch(() => toast({ title: `Resource  '${data}' not found`, position: 'center' }));
    }, [repository, navigation, toast]);

   const navigateToDocument = (docId: string) => navigation.navigate('DocumentDetails', { docId });
        

    return (
        <View flex={ 1 } safeArea>
            <SearchBar { ...{ issueSearch, syncSettings, setSyncSettings, syncStatus, toggleDrawer } } />
            <View style={ styles.container }>
                <Map
                    selectedGeoDocuments={ documents.filter(doc => doc?.resource.geometry) }
                    geoDocuments={ allDocuments.filter(doc => doc?.resource.geometry) }
                    navigateToDocument={ navigateToDocument } />
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
