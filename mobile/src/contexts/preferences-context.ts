import React from 'react';
import { getDefaultPreferences, UsePreferences } from '../hooks/use-preferences';
import { ProjectSettings } from '../models/preferences';

export const PreferencesContext = React.createContext<UsePreferences>({
    preferences: getDefaultPreferences(),
    setCurrentProject: (_project: string) => {},
    setUsername: (_project: string) => {},
    setProjectSettings: (_project: string, _projectSettings: ProjectSettings) => {},
    removeProject: (_project: string) => {}
});
