export interface Settings {
    project: string;
    username: string;
    sync: SyncSettings;
}

export interface SyncSettings {
    url: string;
    password: string;
    connected: boolean;
}
