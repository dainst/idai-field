export interface Preferences {
    username: string;
    currentProject: string;
    recentProjects: string[];
    projects: Record<string, ProjectSettings>;
}

export interface ProjectSettings {
    url: string;
    password: string;
    connected: boolean;
}
