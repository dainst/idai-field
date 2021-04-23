import { createDrawerNavigator } from '@react-navigation/drawer';
import { Document } from 'idai-field-core';
import React, { useState } from 'react';
import DrawerContent from '../components/DrawerContent';
import useSearch from '../hooks/use-search';
import { DocumentRepository } from '../repositories/document-repository';
import HomeScreen from '../screens/HomeScreen';
import RootDrawerParamList from './root-drawer-param-list';


const Drawer = createDrawerNavigator<RootDrawerParamList>();


interface RootDrawerProps {
    repository: DocumentRepository;
}


interface DrawerNavigationCloseAction {
    closeDrawer: () => void;
}


const RootDrawer: React.FC<RootDrawerProps> = ({ repository }) => {

    const [documents, issueSearch] = useSearch(repository);
    const [selectedDocument, setSelectedDocument] = useState<Document>();


    const onDocumentSelected = (doc: Document, navigation: DrawerNavigationCloseAction) => {
    
        navigation.closeDrawer();
        setSelectedDocument(doc);
    };

    return (
        <Drawer.Navigator drawerContent={ ({ navigation }) =>
            <DrawerContent documents={ documents } onDocumentSelected={ doc => onDocumentSelected(doc, navigation) } />
        }>
            <Drawer.Screen name="Home">
                { (props) => <HomeScreen { ...props }
                    repository={ repository }
                    documents={ documents }
                    issueSearch={ issueSearch }
                    selectedDocument={ selectedDocument } /> }
            </Drawer.Screen>
        </Drawer.Navigator>
    );
};


export default RootDrawer;
