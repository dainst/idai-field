import React from 'react';
import { getDefaultPreferences, UsePreferences } from '../hooks/use-preferences';
import { ProjectSettings } from '../models/preferences';
import { defaultPointRadius } from './../components/Project/Map/GLMap/constants';
import { MapSettings } from './../components/Project/Map/map-settings';

export const PreferencesContext = React.createContext<UsePreferences>({
    preferences: getDefaultPreferences(),
    setCurrentProject: (_project: string, _languages?: string[], _options?: unknown) => {},
    setUsername: (_project: string) => {},
    setProjectSettings: (_project: string, _projectSettings: ProjectSettings) => {},
    setLanguages: (_languages: string[]) => {},
    removeProject: (_project: string) => {},
    setMapProviderSettings: (_mapProviderSettings) => {},
    getMapSettings: (_project: string) => ({ pointRadius: defaultPointRadius }),
    setMapSettings: (_project: string, _mapSettings: MapSettings) => {}
});
