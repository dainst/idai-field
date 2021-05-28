import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Document, ProjectConfiguration, SyncStatus } from 'idai-field-core';
import React, { ReactElement, useCallback } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
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
    config: ProjectConfiguration;
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
    config,
    setProjectSettings,
    issueSearch
}): ReactElement => {

    const toggleDrawer = useCallback(() => navigation.toggleDrawer(), [navigation]);

    const onBarCodeScanned = useCallback((data: string) => {

        repository.find({ constraints: { 'identifier:match': data } })
            .then(({ documents: [doc] }) =>
                navigation.navigate('DocumentDetails', { docId: doc.resource.id })
            )
            .catch(() => Alert.alert(
                'Not found',
                `Resource  '${data}' is not available`,
                [ { text: 'OK' } ]
            ));
    }, [repository, navigation]);

   const navigateToDocument = (docId: string) => navigation.navigate('DocumentDetails', { docId });
        

    return (
        <View style={ { flex: 1 } }>
            <View style={ styles.container }>
                <Map
                    selectedGeoDocuments={ documents.filter(doc => doc?.resource.geometry) }
                    geoDocuments={ allDocuments.filter(doc => doc?.resource.geometry) }
                    config={ config }
                    navigateToDocument={ navigateToDocument } />
            </View>
            <ScanBarcodeButton onBarCodeScanned={ onBarCodeScanned } />
            <SearchBar { ...{ issueSearch, projectSettings, setProjectSettings, syncStatus, toggleDrawer } } />
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});


export default DocumentsMap;
