import { createDrawerNavigator, DrawerNavigationProp } from '@react-navigation/drawer';
import { RouteProp } from '@react-navigation/native';
import { Document, SyncStatus } from 'idai-field-core';
import React, { SetStateAction } from 'react';
import { update } from 'tsfun';
import DocumentDetails from '../components/DocumentDetails';
import DocumentsMap from '../components/DocumentsMap';
import DrawerContent from '../components/DrawerContent';
import useSearch from '../hooks/use-search';
import { Preferences, SyncSettings } from '../model/preferences';
import { DocumentRepository } from '../repositories/document-repository';


export type DocumentsContainerDrawerParamList = {
    DocumentsMap: undefined;
    DocumentDetails: { docId: string };
};


export type DocumentsContainerDrawerNavProps<T extends keyof DocumentsContainerDrawerParamList> = {
    navigation: DrawerNavigationProp<DocumentsContainerDrawerParamList, T>;
    route: RouteProp<DocumentsContainerDrawerParamList, T>;
};


const Drawer = createDrawerNavigator<DocumentsContainerDrawerParamList>();


interface DocumentsContainerProps {
    repository: DocumentRepository;
    syncStatus: SyncStatus;
    preferences: Preferences;
    setPreferences: React.Dispatch<SetStateAction<Preferences>>;
}


type DrawerNavigation = DrawerNavigationProp<DocumentsContainerDrawerParamList, 'DocumentsMap' | 'DocumentDetails'>;


const DocumentsContainer: React.FC<DocumentsContainerProps> = ({
    repository,
    syncStatus,
    preferences,
    setPreferences
}) => {

    const [documents, issueSearch] = useSearch(repository);
    const [allDocuments, _] = useSearch(repository);

    const onDocumentSelected = (doc: Document, navigation: DrawerNavigation) => {
    
        navigation.closeDrawer();
        navigation.navigate('DocumentDetails', { docId: doc.resource.id } );
    };

    const setSyncSettings = (newSyncSettings: SyncSettings) =>
        setPreferences(old => update('syncSettings', newSyncSettings, old));

    return (
        
        <Drawer.Navigator
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            drawerContent={ ({ navigation }: { navigation: any }) => {

                return <DrawerContent
                    documents={ documents }
                    onDocumentSelected={ doc => onDocumentSelected(doc, navigation) }
                    onHomeButtonPressed={ () => navigation.navigate('HomeScreen') }
                    onSettingsButtonPressed={ () => navigation.navigate('SettingsScreen') } />;
            } }
        >
            <Drawer.Screen name="DocumentsMap">
                { (props) => <DocumentsMap { ...props }
                    repository={ repository }
                    documents={ documents }
                    allDocuments={ allDocuments }
                    issueSearch={ issueSearch }
                    syncStatus={ syncStatus }
                    syncSettings={ preferences.syncSettings }
                    setSyncSettings={ setSyncSettings } /> }
            </Drawer.Screen>
            <Drawer.Screen name="DocumentDetails">
                { (props) => <DocumentDetails { ...props }
                    docId={ props.route.params.docId }
                    repository={ repository }
                /> }
            </Drawer.Screen>
        </Drawer.Navigator>
    );
};


export default DocumentsContainer;
