import { MapSettings } from '@/components/Project/Map/map-settings';

export interface MapProviderSettings {
    kakaoLocalRestApiKey: string;
    kakaoMapJavaScriptKey: string;
    kakaoNativeAppKey: string;
}

export interface Preferences {
    username: string;
    languages: string[];
    currentProject: string;
    recentProjects: string[];
    projects: Record<string, ProjectSettings>;
    mapProviderSettings: MapProviderSettings;
}

export interface ProjectSettings {
    url: string;
    password: string;
    connected: boolean;
    languages?: string[];
    mapSettings: MapSettings;
}
