import { createDrawerNavigator, DrawerNavigationProp } from '@react-navigation/drawer';
import { RouteProp } from '@react-navigation/native';
import { Document } from 'idai-field-core';
import React, { SetStateAction } from 'react';
import DocumentDetails from '../components/DocumentDetails';
import DocumentsMap from '../components/DocumentsMap';
import DrawerContent from '../components/DrawerContent';
import useSearch from '../hooks/use-search';
import { Settings } from '../model/settings';
import { DocumentRepository } from '../repositories/document-repository';


export type DocumentsScreenDrawerParamList = {
    DocumentsMap: undefined;
    DocumentDetails: { docId: string };
};


export type DocumentsScreenDrawerNavProps<T extends keyof DocumentsScreenDrawerParamList> = {
    navigation: DrawerNavigationProp<DocumentsScreenDrawerParamList, T>;
    route: RouteProp<DocumentsScreenDrawerParamList, T>;
};


const Drawer = createDrawerNavigator<DocumentsScreenDrawerParamList>();


interface DocumentsScreenProps {
    repository: DocumentRepository;
    settings: Settings;
    setSettings: React.Dispatch<SetStateAction<Settings>>;
}


const DocumentsScreen: React.FC<DocumentsScreenProps> = ({ repository, settings, setSettings }) => {

    
    const [documents, issueSearch] = useSearch(repository);


    const onDocumentSelected = (
            doc: Document,
            navigation: DrawerNavigationProp<DocumentsScreenDrawerParamList, 'DocumentsMap' | 'DocumentDetails'>
    ) => {
    
        navigation.closeDrawer();
        navigation.navigate('DocumentDetails', { docId: doc.resource.id } );
    };

    return (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <Drawer.Navigator drawerContent={ ({ navigation }: { navigation: any }) => {

            return <DrawerContent
                documents={ documents }
                onDocumentSelected={ doc => onDocumentSelected(doc, navigation) } />;
        } }>
            <Drawer.Screen name="DocumentsMap">
                { (props) => <DocumentsMap { ...props }
                    repository={ repository }
                    documents={ documents }
                    issueSearch={ issueSearch }
                    settings={ settings }
                    setSettings={ setSettings } /> }
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


export default DocumentsScreen;
