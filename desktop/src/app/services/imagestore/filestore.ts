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

    constructor(private settingsProvider: SettingsProvider) {}


    /**
     * Tests if a file exists in the current project
     * @param path should start with /
     */
    public fileExists = (path: string) => {

        return FsAdapter.fileExists(this.getFullPath(path));
    }


    /**
     * Writes a files for the current project
     * @param path should start with /
     */
    public writeFile = (path: string, contents: any) => {

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

        return this.settingsProvider.getSettings().imagestorePath
            + this.settingsProvider.getSettings().selectedProject + path;
    }
}
