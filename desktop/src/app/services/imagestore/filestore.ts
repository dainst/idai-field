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


    public fileExists = (path: string) => {

        return FsAdapter.fileExists(this.settingsProvider.getSettings().imagestorePath + path);
    }


    public writeFile = (path: string, contents: any) => {

        return FsAdapter.writeFile(this.settingsProvider.getSettings().imagestorePath + path, contents);
    }


    public readFile = (path: string) => {

        return FsAdapter.readFile(this.settingsProvider.getSettings().imagestorePath + path);
    }
}
