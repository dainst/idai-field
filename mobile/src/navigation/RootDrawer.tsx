import { createDrawerNavigator, DrawerNavigationProp } from '@react-navigation/drawer';
import { Document } from 'idai-field-core';
import React from 'react';
import DrawerContent from '../components/DrawerContent';
import useSearch from '../hooks/use-search';
import { DocumentRepository } from '../repositories/document-repository';
import DocumentsScreen from '../screens/DocumentsScreen';
import RootDrawerParamList from './root-drawer-param-list';


const Drawer = createDrawerNavigator<RootDrawerParamList>();


interface RootDrawerProps {
    repository: DocumentRepository;
}


const RootDrawer: React.FC<RootDrawerProps> = ({ repository }) => {

    const [documents, issueSearch] = useSearch(repository);


    const onDocumentSelected = (doc: Document, navigation: DrawerNavigationProp<RootDrawerParamList, 'Documents'>) => {
    
        navigation.closeDrawer();
        navigation.navigate('Documents', { screen: 'DocumentDetails', params: { docId: doc.resource.id } });
    };

    return (
        <Drawer.Navigator drawerContent={ ({ navigation }) => {

            const nav = navigation as unknown as DrawerNavigationProp<RootDrawerParamList, 'Documents'>;
            return <DrawerContent
                documents={ documents }
                onDocumentSelected={ doc => onDocumentSelected(doc, nav) } />;
        } }>
            <Drawer.Screen name="Documents">
                { (props) => <DocumentsScreen { ...props }
                    repository={ repository }
                    documents={ documents }
                    issueSearch={ issueSearch } /> }
            </Drawer.Screen>
        </Drawer.Navigator>
    );
};


export default RootDrawer;
