import React, {
  createContext,
  useState,
  useContext,
  Dispatch,
  SetStateAction,
} from 'react';
import { Document } from 'idai-field-core';
import usePouchDbDatastore from '@/hooks/use-pouchdb-datastore';
import useRepository from '@/hooks/use-repository';
import useSync from '@/hooks/use-sync';
import useRelationsManager from '@/hooks/use-relations-manager';
import { ConfigurationContext } from '@/contexts/configuration-context';
import { PreferencesContext } from '@/contexts/preferences-context';
import { DocumentRepository } from '@/repositories/document-repository';
import { RelationsManager, SyncStatus } from 'idai-field-core';
import useProjectData from '@/hooks/use-project-data';
import {router} from 'expo-router'
import useOrientation from '@/hooks/use-orientation';

interface ProjectContextType {
  q: string;
  documents: Document[];
  hierarchyPath: Document[];
  pushToHierarchy: (doc: Document) => void;
  popFromHierarchy: (doc: Document) => void;
  onDocumentSelected: (doc: Document) => void;
  onParentSelected: (doc: Document) => void;
  isInOverview: (category: string) => boolean;
  setQ: Dispatch<SetStateAction<string>>;
  repository: DocumentRepository | undefined;
  syncStatus: SyncStatus | undefined;
  relationsManager: RelationsManager | undefined;
}

export const ProjectContext = createContext<ProjectContextType>(null);

export const ProjectContextProvider = ({ children }) => {
  const [q, setQ] = useState<string>('');

  const [hierarchyBack, setHierarchyBack] = useState<boolean>(false);

  const orientation = useOrientation();

  const config = useContext(ConfigurationContext);
  const preferences = useContext(PreferencesContext);

  const pouchdbDatastore = usePouchDbDatastore(
    preferences.preferences.currentProject
  );

  const repository = useRepository(
    preferences.preferences.username,
    config?.getCategories() || [],
    pouchdbDatastore
  );

  const syncStatus = useSync({
    project: preferences.preferences.currentProject,
    projectSettings:
      preferences.preferences.projects[preferences.preferences.currentProject],
    pouchdbDatastore,
  });

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

  const onDocumentSelected = (doc: Document) => {
    router.setParams({ highlightedDocId: doc.resource.id })
    router.navigate('/ProjectScreen/DocumentsMap' );
};

// useEffect(() => {

//   if (!hierarchyBack && !hierarchyPath.length) {
//       hierarchyNavigationRef.current?.dispatch(StackActions.push('DocumentsList', documents));
//   } else if (hierarchyNavigationRef.current?.canGoBack()) {
//       hierarchyNavigationRef.current.goBack();
//   }
// // necessary in order to prevent calling the effect when hierarchyBack changes
// // eslint-disable-next-line react-hooks/exhaustive-deps
// }, [documents]);


const onParentSelected = (doc: Document) => {
  setHierarchyBack(false);
  pushToHierarchy(doc);
  router.setParams({ highlightedDocId: doc.resource.id })
  router.navigate('/ProjectScreen/DocumentsMap',  );
};



  return (
    <ProjectContext.Provider
      value={{
        documents,
        hierarchyPath,
        pushToHierarchy,
        popFromHierarchy,
        isInOverview,
        q,
        setQ,
        syncStatus,
        repository,
        relationsManager,
        onDocumentSelected,
        onParentSelected,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
