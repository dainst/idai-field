import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Document, SyncStatus } from 'idai-field-core';
import { useToast, View } from 'native-base';
import React, { ReactElement, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { ProjectSettings } from '../../models/preferences';
import { DocumentRepository } from '../../repositories/document-repository';
import { DocumentsContainerDrawerParamList } from './DocumentsContainer';
import Map from './Map/Map';
import ScanBarcodeButton from './ScanBarcodeButton';
import SearchBar from './SearchBar';


interface DocumentsMapProps {
    navigation: DrawerNavigationProp<DocumentsContainerDrawerParamList, 'DocumentsMap'>;
    repository: DocumentRepository;
    documents: Document[];
    allDocuments: Document[];
    selectedDocument?: Document;
    syncStatus: SyncStatus;
    projectSettings: ProjectSettings;
    setProjectSettings: (projectSettings: ProjectSettings) => void;
    issueSearch: (q: string) => void;
}


const DocumentsMap: React.FC<DocumentsMapProps> = ({
    navigation,
    repository,
    documents,
    allDocuments,
    syncStatus,
    projectSettings,
    setProjectSettings,
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
            <SearchBar { ...{ issueSearch, projectSettings, setProjectSettings, syncStatus, toggleDrawer } } />
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
