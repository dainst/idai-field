export interface Preferences {
    settings: Settings;
    syncSettings: SyncSettings;
    recentProjects: string[];
}

export interface Settings {
    project: string;
    username: string;
}

export interface SyncSettings {
    url: string;
    password: string;
    connected: boolean;
}
