import { createDrawerNavigator, DrawerNavigationProp } from '@react-navigation/drawer';
import { RouteProp } from '@react-navigation/native';
import { Document, ProjectCategories, ProjectConfiguration, Query, SyncStatus } from 'idai-field-core';
import React, { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { dropRight, last } from 'tsfun';
import useSearch from '../../hooks/use-search';
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

    const [query, setQuery] = useState<Query>({
        categories: ProjectCategories.getOperationCategoryNames(config.getCategoryForest()),
        constraints: {}
    });
    const documents = useSearch(repository, query);

    const [q, setQ] = useState<string>('');

    const [hierarchyPath, setHierarchyPath] = useState<Document[]>([]);
    
    const dimensions = useWindowDimensions();

    useEffect(() => {

        const operationCategories = ProjectCategories.getOperationCategoryNames(config.getCategoryForest());
        const concreteCategories = ProjectCategories.getConcreteFieldCategoryNames(config.getCategoryForest());
        
        if (q) {
            setQuery({ q, categories: concreteCategories });
        } else {
            const currentParent = last(hierarchyPath);
            if (currentParent) {
                if (operationCategories.includes(currentParent.resource.category)) {
                    setQuery({ constraints: {
                        'isRecordedIn:contain': currentParent.resource.id,
                        'liesWithin:exist': 'UNKNOWN'
                    } });
                } else {
                    setQuery({ constraints: { 'liesWithin:contain': currentParent.resource.id } });
                }
            } else {
                setQuery({ categories: operationCategories });
            }
        }
    }, [config, q, hierarchyPath]);

    const onDocumentSelected = (doc: Document, navigation: DrawerNavigation) => {
    
        navigation.closeDrawer();
        navigation.navigate('DocumentDetails', { docId: doc.resource.id } );
    };

    return (
        <Drawer.Navigator
            drawerType={ dimensions.width > 768 ? 'permanent' : 'front' }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            drawerContent={ ({ navigation }: { navigation: any }) => {

                return <DocumentsDrawer
                    documents={ documents }
                    config={ config }
                    showHierarchyBackButton={ hierarchyPath.length > 0 }
                    onDocumentSelected={ doc => onDocumentSelected(doc, navigation) }
                    onHomeButtonPressed={ () => navigation.navigate('HomeScreen') }
                    onSettingsButtonPressed={ () => navigation.navigate('SettingsScreen') }
                    onParentSelected={ doc => setHierarchyPath(old => [...old, doc]) }
                    onHierarchyBack={ () => setHierarchyPath(old => dropRight(1, old)) }
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
