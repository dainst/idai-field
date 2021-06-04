import { createDrawerNavigator, DrawerNavigationProp } from '@react-navigation/drawer';
import { RouteProp } from '@react-navigation/native';
import { Document, ProjectConfiguration, SyncStatus } from 'idai-field-core';
import React, { useState } from 'react';
import { last } from 'tsfun';
import useOrientation from '../../hooks/use-orientation';
import useProjectData from '../../hooks/use-project-data';
import { ProjectSettings } from '../../models/preferences';
import { DocumentRepository } from '../../repositories/document-repository';
import DocumentDetails from './DocumentDetails';
import DocumentsDrawer from './DocumentsDrawer';
import DocumentsMap from './DocumentsMap';


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
    projectSettings: ProjectSettings;
    config: ProjectConfiguration;
    languages: string[],
    setProjectSettings: (projectSettings: ProjectSettings) => void;
}


type DrawerNavigation = DrawerNavigationProp<DocumentsContainerDrawerParamList, 'DocumentsMap' | 'DocumentDetails'>;


const DocumentsContainer: React.FC<DocumentsContainerProps> = ({
    repository,
    syncStatus,
    projectSettings,
    config,
    languages,
    setProjectSettings
}) => {

    const [q, setQ] = useState<string>('');
    const orientation = useOrientation();
    const { documents, hierarchyPath, pushToHierarchy, popFromHierarchy } = useProjectData(config, repository, q);

    const onDocumentSelected = (doc: Document, navigation: DrawerNavigation) => {
    
        navigation.closeDrawer();
        navigation.navigate('DocumentDetails', { docId: doc.resource.id } );
    };

    return (
        <Drawer.Navigator
            drawerType={ orientation === 'landscape' ? 'permanent' : 'front' }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            drawerContent={ ({ navigation }: { navigation: any }) => {

                return <DocumentsDrawer
                    navigation={ navigation }
                    documents={ documents }
                    config={ config }
                    currentParent={ last(hierarchyPath) }
                    onDocumentSelected={ doc => onDocumentSelected(doc, navigation) }
                    onHomeButtonPressed={ () => navigation.navigate('HomeScreen') }
                    onSettingsButtonPressed={ () => navigation.navigate('SettingsScreen') }
                    onParentSelected={ pushToHierarchy }
                    onHierarchyBack={ popFromHierarchy }
                />;
            } }
        >
            <Drawer.Screen name="DocumentsMap">
                { (props) => <DocumentsMap { ...props }
                    repository={ repository }
                    documents={ documents }
                    issueSearch={ setQ }
                    syncStatus={ syncStatus }
                    projectSettings={ projectSettings }
                    config={ config }
                    setProjectSettings={ setProjectSettings } /> }
            </Drawer.Screen>
            <Drawer.Screen name="DocumentDetails">
                { (props) => <DocumentDetails { ...props }
                    config={ config }
                    docId={ props.route.params.docId }
                    repository={ repository }
                    languages={ languages }
                /> }
            </Drawer.Screen>
        </Drawer.Navigator>
    );
};


export default DocumentsContainer;
