import { NavigatorScreenParams } from '@react-navigation/core';
import { createDrawerNavigator, DrawerNavigationProp } from '@react-navigation/drawer';
import { Document } from 'idai-field-core';
import React from 'react';
import DocumentsMap, { DocumentsMapStackParamList } from '../components/DocumentsMap';
import DrawerContent from '../components/DrawerContent';
import useSearch from '../hooks/use-search';
import { DocumentRepository } from '../repositories/document-repository';


export type DocumentsScreenDrawerParamList = {
    Documents: NavigatorScreenParams<DocumentsMapStackParamList>;
};


const Drawer = createDrawerNavigator<DocumentsScreenDrawerParamList>();


interface DocumentsScreenProps {
    repository: DocumentRepository;
}


const DocumentsScreen: React.FC<DocumentsScreenProps> = ({ repository }) => {

    const [documents, issueSearch] = useSearch(repository);


    const onDocumentSelected = (
            doc: Document,
            navigation: DrawerNavigationProp<DocumentsScreenDrawerParamList, 'Documents'>
    ) => {
    
        navigation.closeDrawer();
        navigation.navigate('Documents', { screen: 'DocumentDetails', params: { docId: doc.resource.id } });
    };

    return (
        <Drawer.Navigator drawerContent={ ({ navigation }) => {

            const nav = navigation as unknown as DrawerNavigationProp<DocumentsScreenDrawerParamList, 'Documents'>;
            return <DrawerContent
                documents={ documents }
                onDocumentSelected={ doc => onDocumentSelected(doc, nav) } />;
        } }>
            <Drawer.Screen name="Documents">
                { (props) => <DocumentsMap { ...props }
                    repository={ repository }
                    documents={ documents }
                    issueSearch={ issueSearch } /> }
            </Drawer.Screen>
        </Drawer.Navigator>
    );
};


export default DocumentsScreen;
