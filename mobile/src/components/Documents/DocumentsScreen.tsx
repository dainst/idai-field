import React from 'react';
import useConfiguration from '../../hooks/use-configuration';
import usePouchdbManager from '../../hooks/use-pouchdb-manager';
import useRepository from '../../hooks/use-repository';
import useSync from '../../hooks/use-sync';
import { Preferences, ProjectSettings } from '../../models/preferences';
import DocumentsContainer from './DocumentsContainer';


interface DocumentsScreenProps {
    preferences: Preferences;
    setProjectSettings: (projectSettings: ProjectSettings) => void;
}


const DocumentsScreen: React.FC<DocumentsScreenProps> = ({ preferences, setProjectSettings }) => {

    const pouchdbManager = usePouchdbManager(preferences.currentProject);

    const config = useConfiguration(
        preferences.currentProject,
        preferences.languages,
        preferences.username,
        pouchdbManager,
    );

    const repository = useRepository(
        preferences.currentProject,
        preferences.username,
        config?.getCategoryForest() || [],
        pouchdbManager,
    );

    const syncStatus = useSync(
        preferences.currentProject,
        preferences.projects[preferences.currentProject],
        repository,
        pouchdbManager
    );

    return (repository && config)
        ? <DocumentsContainer
            projectSettings={ preferences.projects[preferences.currentProject] }
            setProjectSettings={ setProjectSettings }
            config={ config }
            repository={ repository }
            syncStatus={ syncStatus }
            languages={ preferences.languages }
        />
        : null;
};


export default DocumentsScreen;
