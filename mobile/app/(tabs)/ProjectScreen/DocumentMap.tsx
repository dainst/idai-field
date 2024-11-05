import {
    createDrawerNavigator,
    DrawerNavigationProp,
  } from '@react-navigation/drawer';
  import {
    NavigationContainerRef,
    RouteProp,
    StackActions,
  } from '@react-navigation/native';
  import { Document, RelationsManager, SyncStatus } from 'idai-field-core';
  import React, { useEffect, useRef, useState,useContext } from 'react';
  import { last } from 'tsfun';
  import useOrientation from '@/hooks/use-orientation';
  import useProjectData from '@/hooks/use-project-data';
  
import { ConfigurationContext } from '@/contexts/configuration-context';
import { PreferencesContext } from '@/contexts/preferences-context';
import usePouchDbDatastore from '@/hooks/use-pouchdb-datastore';
import useRepository from '@/hooks/use-repository';
import useSync from '@/hooks/use-sync';
import useRelationsManager from '@/hooks/use-relations-manager';
import DocumentsMap from '@/components/Project/DocumentsMap';


  

    
  const DocumentsContainer: React.FC = () => {
    const [q, setQ] = useState<string>('');
    // const [hierarchyBack, setHierarchyBack] = useState<boolean>(false);
  
    // const orientation = useOrientation();
  
  
    const config =  useContext(ConfigurationContext)
    const preferences =  useContext(PreferencesContext)

    const pouchdbDatastore = usePouchDbDatastore(
        preferences.preferences.currentProject
      );
    
      const repository = useRepository(
        preferences.preferences.username,
        config?.getCategories() || [],
        pouchdbDatastore
      );
    
      const syncStatus = useSync(
        preferences.preferences.currentProject,
        preferences.preferences.projects[preferences.preferences.currentProject],
        pouchdbDatastore
      );

      const relationsManager = useRelationsManager(
        repository?.datastore,
        config,
        preferences.preferences.username
      );

      const {
        documents,
        hierarchyPath,
        pushToHierarchy,
        popFromHierarchy,
        isInOverview,
      } = useProjectData(repository, q);

    
    
     
    // repository.create({_id:'hello',})
    // const hierarchyNavigationRef = useRef<NavigationContainerRef>(null);
  
    // const onDocumentSelected = (doc: Document, navigation: DrawerNavigation) => {
    //   navigation.closeDrawer();
    //   navigation.navigate('DocumentsMap', { highlightedDocId: doc.resource.id });
    // };
  
    // useEffect(() => {
    //   if (!hierarchyBack && !hierarchyPath.length) {
    //     hierarchyNavigationRef.current?.dispatch(
    //       StackActions.push('DocumentsList', documents)
    //     );
    //   } else if (hierarchyNavigationRef.current?.canGoBack()) {
    //     hierarchyNavigationRef.current.goBack();
    //   }
    //   // necessary in order to prevent calling the effect when hierarchyBack changes
    //   // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [documents]);
  


    return    <DocumentsMap
                repository={repository}
                documents={documents}
                issueSearch={setQ}
                syncStatus={syncStatus}
                relationsManager={relationsManager}
                isInOverview={isInOverview}
                selectParent={(doc) => console.log(doc)}
              />
  };
  
  export default DocumentsContainer;
  