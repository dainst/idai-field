import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { assoc, compose, prepend, set, update } from 'tsfun';
import { Preferences, ProjectSettings } from '../model/preferences';


interface UsePreferences {
    preferences: Preferences;
    setCurrentProject: (project: string) => void;
    setUsername: (project: string) => void;
    setProjectSettings: (projectSettings: ProjectSettings) => void;
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

    const setProjectSettings = (projectSettings: ProjectSettings) =>
        setPreferences(update(['projects', preferences.currentProject], projectSettings));

    const setUsername = (username: string) =>
        setPreferences(update('username', username));

    return { preferences, setCurrentProject, setUsername, setProjectSettings };

};

export default usePreferences;


const loadPreferences = async (): Promise<Preferences> => {

    const prefString = await AsyncStorage.getItem('preferences');
    return prefString ? JSON.parse(prefString) : getDefaultPreferences();
};
    
    
const savePreferences = async (preferences: Preferences) =>
    await AsyncStorage.setItem('preferences', JSON.stringify(preferences));


const getDefaultPreferences = (): Preferences => ({
    currentProject: 'test',
    username: '',
    recentProjects: [],
    projects: {}
});


const getDefaultProjectSettings = (): ProjectSettings => ({
    url: '',
    password: '',
    connected: false
});
