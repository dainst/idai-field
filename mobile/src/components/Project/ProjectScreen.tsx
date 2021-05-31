import React, { useCallback } from 'react';
import useConfiguration from '../../hooks/use-configuration';
import usePouchdbManager from '../../hooks/use-pouchdb-manager';
import useRepository from '../../hooks/use-repository';
import useSync from '../../hooks/use-sync';
import { Preferences, ProjectSettings } from '../../models/preferences';
import DocumentsContainer from './DocumentsContainer';


interface ProjectScreenProps {
    currentProject: string;
    preferences: Preferences;
    setProjectSettings: (project: string, projectSettings: ProjectSettings) => void;
}


const ProjectScreen: React.FC<ProjectScreenProps> = ({ currentProject, preferences, setProjectSettings }) => {

    const pouchdbManager = usePouchdbManager(currentProject);

    const config = useConfiguration(
        currentProject,
        preferences.languages,
        preferences.username,
        pouchdbManager,
    );

    const repository = useRepository(
        preferences.username,
        config?.getCategoryForest() || [],
        pouchdbManager,
    );

    const syncStatus = useSync(
        currentProject,
        preferences.projects[currentProject],
        repository,
        pouchdbManager,
    );

    const setCurrentProjectSettings = useCallback(settings => {
        setProjectSettings(currentProject, settings);
    }, [currentProject, setProjectSettings]);

    return (repository && config)
        ? <DocumentsContainer
            projectSettings={ preferences.projects[currentProject] }
            setProjectSettings={ setCurrentProjectSettings }
            config={ config }
            repository={ repository }
            syncStatus={ syncStatus }
            languages={ preferences.languages }
        />
        : null;
};


export default ProjectScreen;
