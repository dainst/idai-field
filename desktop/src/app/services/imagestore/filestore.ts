import { Injectable } from '@angular/core';
import { SettingsProvider } from '../settings/settings-provider';
import { FsAdapter } from './fs-adapter';

@Injectable()
/**
 * @author Daniel de Oliveira
 */
// Impl note: We use the '=>'-forms of functions on purpose such that
// they are bound to the Filestore context and can be used as params
export class Filestore {

    // TODO pass FsAdapter as param
    constructor(private settingsProvider: SettingsProvider) {}


    /**
     * Writes a files for the current project.
     * If it already exists, does nothing.
     *
     * @param path should start with /
     */
    public writeFile = (path: string, contents: any) => {

        const fullPath = this.getFullPath(path);
        if (FsAdapter.fileExists(fullPath)) return;

        return FsAdapter.writeFile(this.getFullPath(path), contents);
    }


    /**
     * Reads a file from the current project
     * @param path should start with /
     */
    public readFile = (path: string) => {

        return FsAdapter.readFile(this.getFullPath(path));
    }


    private getFullPath = (path: string): string => {

        const settings = this.settingsProvider.getSettings()
        return settings.imagestorePath + settings.selectedProject + path;
    }
}
