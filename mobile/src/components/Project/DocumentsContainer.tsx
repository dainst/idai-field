import { createDrawerNavigator, DrawerNavigationProp } from '@react-navigation/drawer';
import { NavigationContainerRef, RouteProp, StackActions } from '@react-navigation/native';
import { Document, ProjectConfiguration, RelationsManager, SyncStatus } from 'idai-field-core';
import React, { useEffect, useRef, useState } from 'react';
import { last } from 'tsfun';
import useOrientation from '../../hooks/use-orientation';
import useProjectData from '../../hooks/use-project-data';
import { ProjectSettings } from '../../models/preferences';
import { DocumentRepository } from '../../repositories/document-repository';
import DocumentAdd from './DocumentAdd';
import DocumentsDrawer from './DocumentsDrawer';
import DocumentsMap from './DocumentsMap';


export type DocumentsContainerDrawerParamList = {
    DocumentsMap: { highlightedDocId?: string };
    DocumentDetails: { docId: string };
    DocumentAdd: { parentDoc: Document, categoryName: string };
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
    relationsManager: RelationsManager;
    username: string;
    languages: string[];
    setProjectSettings: (projectSettings: ProjectSettings) => void;
}


type DrawerNavigation = DrawerNavigationProp<DocumentsContainerDrawerParamList, 'DocumentsMap' | 'DocumentDetails'>;


const DocumentsContainer: React.FC<DocumentsContainerProps> = ({
    repository,
    syncStatus,
    projectSettings,
    config,
    relationsManager,
    username,
    languages,
    setProjectSettings
}) => {

    const [q, setQ] = useState<string>('');
    const orientation = useOrientation();
    const { documents, hierarchyPath,
            pushToHierarchy, popFromHierarchy, isInOverview } = useProjectData(config, repository, q);
    const [hierarchyBack, setHierarchyBack] = useState<boolean>(false);

    const hierarchyNavigationRef = useRef<NavigationContainerRef>(null);

    const onDocumentSelected = (doc: Document, navigation: DrawerNavigation) => {
    
        navigation.closeDrawer();
        navigation.navigate('DocumentsMap', { highlightedDocId: doc.resource.id } );
    };

    useEffect(() => {

        if (!hierarchyBack && !isInOverview()) {
            hierarchyNavigationRef.current?.dispatch(StackActions.push('DocumentsList', documents));
        } else if (hierarchyNavigationRef.current?.canGoBack()) {
            hierarchyNavigationRef.current.goBack();
        }
    // necessary in order to prevent calling the effect when hierarchyBack changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [documents]);

    const onParentSelected = (doc: Document) => {

        setHierarchyBack(false);
        pushToHierarchy(doc);
    };

    const onHierarchyBack = () => {

        setHierarchyBack(true);
        popFromHierarchy();
    };

    const handleSelectDocument = (doc: Document) => onParentSelected(doc);

    return (
        <Drawer.Navigator
            drawerType={ orientation === 'landscape' ? 'permanent' : 'front' }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            drawerContent={ ({ navigation }: { navigation: any }) => {

                return <DocumentsDrawer
                    hierarchyNavigationRef={ hierarchyNavigationRef }
                    documents={ documents }
                    config={ config }
                    currentParent={ last(hierarchyPath) }
                    onDocumentSelected={ doc => onDocumentSelected(doc, navigation) }
                    onHomeButtonPressed={ () => navigation.navigate('HomeScreen') }
                    onSettingsButtonPressed={ () => navigation.navigate('SettingsScreen') }
                    onParentSelected={ onParentSelected }
                    onHierarchyBack={ onHierarchyBack }
                />;
            } }
        >
            <Drawer.Screen name="DocumentsMap">
                { ({ navigation, route }) => <DocumentsMap
                    route={ route }
                    navigation={ navigation }
                    repository={ repository }
                    documents={ documents }
                    issueSearch={ setQ }
                    syncStatus={ syncStatus }
                    projectSettings={ projectSettings }
                    config={ config }
                    relationsManager={ relationsManager }
                    languages={ languages }
                    setProjectSettings={ setProjectSettings }
                    isInOverview={ isInOverview }
                    selectDocument={ handleSelectDocument } /> }
            </Drawer.Screen>
            <Drawer.Screen name="DocumentAdd">
                { ({ navigation, route }) => <DocumentAdd
                    navigation={ navigation }
                    username={ username }
                    config={ config }
                    repository={ repository }
                    languages={ languages }
                    parentDoc={ route.params.parentDoc }
                    categoryName={ route.params.categoryName }
                /> }
            </Drawer.Screen>
        </Drawer.Navigator>
    );
};


export default DocumentsContainer;
