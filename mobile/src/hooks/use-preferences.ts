import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { assoc, compose, detach, prepend, set, subtract, update } from 'tsfun';
import { Preferences, ProjectSettings } from '../models/preferences';


interface UsePreferences {
    preferences: Preferences;
    setCurrentProject: (project: string) => void;
    setUsername: (project: string) => void;
    setProjectSettings: (project: string, projectSettings: ProjectSettings) => void;
    removeProject: (project: string) => void;
}


const usePreferences = (): UsePreferences => {
    
    const [preferences, setPreferences] = useState<Preferences>(getDefaultPreferences());


    useEffect(() => {

        loadPreferences().then(setPreferences);
    }, []);


    useEffect(() => {

        savePreferences(preferences);
    }, [preferences]);


    const setCurrentProject = (project: string) =>
        setPreferences(
            compose(
                update('currentProject', project),
                update('recentProjects', (_: string[]) => set(prepend(project)(_))),
                update('projects', (_: Record<string, ProjectSettings>) =>
                    _[project] ? _ : assoc(project, getDefaultProjectSettings(), _))
            )
        );


    const setProjectSettings = (project: string, projectSettings: ProjectSettings) =>
        setPreferences(update(['projects', project], projectSettings));


    const setUsername = (username: string) =>
        setPreferences(update('username', username));


    const removeProject = (project: string) =>
        setPreferences(
            compose(
                update('projects', detach(project)),
                update('recentProjects', subtract([project]))
            )
        );


    return { preferences, setCurrentProject, setUsername, setProjectSettings, removeProject };

};

export default usePreferences;


const loadPreferences = async (): Promise<Preferences> => {

    const prefString = await AsyncStorage.getItem('preferences');
    return prefString ? JSON.parse(prefString) : getDefaultPreferences();
};
    
    
const savePreferences = async (preferences: Preferences) =>
    await AsyncStorage.setItem('preferences', JSON.stringify(preferences));


const getDefaultPreferences = (): Preferences => ({
    languages: ['en'], // TODO make language configurable
    username: '',
    recentProjects: [],
    projects: {}
});


const getDefaultProjectSettings = (): ProjectSettings => ({
    url: '',
    password: '',
    connected: false
});
