import React, { useContext } from 'react';
import { ConfigurationContext } from '@/contexts/configuration-context';
import { PreferencesContext } from '@/contexts/preferences-context';
import useConfiguration from '@/hooks/use-configuration';
import usePouchDbDatastore from '@/hooks/use-pouchdb-datastore';
import useRelationsManager from '@/hooks/use-relations-manager';
import useRepository from '@/hooks/use-repository';
import useSync from '@/hooks/use-sync';
import DocumentsContainer from './DocumentsContainer';

const ProjectScreen: React.FC = () => {

    const preferences = useContext(PreferencesContext);
    const pouchdbDatastore = usePouchDbDatastore(preferences.preferences.currentProject);

    const config = useConfiguration(
        preferences.preferences.currentProject,
        preferences.preferences.languages,
        preferences.preferences.username,
        pouchdbDatastore,
    );

    const repository = useRepository(
        preferences.preferences.username,
        config?.getCategories() || [],
        pouchdbDatastore,
    );

    const syncStatus = useSync(
        preferences.preferences.currentProject,
        preferences.preferences.projects[preferences.preferences.currentProject],
        pouchdbDatastore,
    );
    
    const relationsManager = useRelationsManager(
        repository?.datastore,
        config,
        preferences.preferences.username
    );

    return (repository && config && relationsManager)
        ? <ConfigurationContext.Provider value={ config }>
            <DocumentsContainer
                relationsManager={ relationsManager }
                repository={ repository }
                syncStatus={ syncStatus }
            />
        </ConfigurationContext.Provider>
        : null;
};


export default ProjectScreen;
