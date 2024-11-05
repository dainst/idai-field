import React, { useContext } from 'react';
import { ConfigurationContext } from '@/contexts/configuration-context';
import { PreferencesContext } from '@/contexts/preferences-context';
import usePouchDbDatastore from '@/hooks/use-pouchdb-datastore';
import useRelationsManager from '@/hooks/use-relations-manager';
import useRepository from '@/hooks/use-repository';
import useSync from '@/hooks/use-sync';
import DocumentsContainer from './DocumentsContainer';
import { Text } from 'react-native';

const ProjectScreen: React.FC = () => {

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

  return <Text>Index</Text>;
  // if (relationsManager && repository) {
  //   return (
  //       <DocumentsContainer
  //         relationsManager={relationsManager}
  //         repository={repository}
  //         syncStatus={syncStatus}
  //       />
  //   );
  // } else {
  //   return ;
  // }
};

export default ProjectScreen;
