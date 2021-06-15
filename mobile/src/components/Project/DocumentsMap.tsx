import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RouteProp } from '@react-navigation/native';
import { Document, ProjectConfiguration, SyncStatus } from 'idai-field-core';
import React, { ReactElement, useCallback, useMemo } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ProjectSettings } from '../../models/preferences';
import { DocumentRepository } from '../../repositories/document-repository';
import { DocumentsContainerDrawerParamList } from './DocumentsContainer';
import Map from './Map/Map';
import SearchBar from './SearchBar';


interface DocumentsMapProps {
    route: RouteProp<DocumentsContainerDrawerParamList, 'DocumentsMap'>;
    navigation: DrawerNavigationProp<DocumentsContainerDrawerParamList, 'DocumentsMap'>;
    repository: DocumentRepository;
    documents: Document[];
    selectedDocument?: Document;
    syncStatus: SyncStatus;
    projectSettings: ProjectSettings;
    config: ProjectConfiguration;
    languages: string[];
    setProjectSettings: (projectSettings: ProjectSettings) => void;
    issueSearch: (q: string) => void;
}


const DocumentsMap: React.FC<DocumentsMapProps> = ({
    route,
    navigation,
    repository,
    documents,
    syncStatus,
    projectSettings,
    config,
    languages,
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

   const addDocument = (parentDoc: Document) => navigation.navigate('DocumentAdd',{ parentDoc });
        
    return (
        <View style={ { flex: 1 } }>
            <SearchBar { ...{
                issueSearch,
                projectSettings,
                setProjectSettings,
                syncStatus,
                toggleDrawer,
                onBarCodeScanned
            } } />
            <View style={ styles.container }>
                <Map
                    repository={ repository }
                    selectedDocumentIds={ useMemo(() =>
                        documents.filter(doc => doc?.resource.geometry)
                        .map(doc => doc.resource.id),[documents]) }
                    config={ config }
                    languages={ languages }
                    highlightedDocId={ route.params?.highlightedDocId }
                    addDocument={ addDocument } />
            </View>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});


export default DocumentsMap;
