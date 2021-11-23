import { Injectable } from '@angular/core';
import { Maybe, isOk, ok, just, nothing } from 'tsfun';
import { SettingsProvider } from '../settings/settings-provider';
import { HttpAdapter } from './http-adapter';

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class RemoteFilestore {

    constructor(private settingsProvider: SettingsProvider,
                private httpAdapter: HttpAdapter) {}


    public isOn = () => isOk(this.getAddress()) && this.mySyncIsOn();


    /**
     * Get a file for the current project.
     *
     * @param path should start with /
     * @throws NOT_ONLINE. Make sure checking isOn() before calling this method
     */
    public get(path: string) {

        const address = this.getAddress();
        if (!isOk(address) || !this.mySyncIsOn()) throw 'NOT_ONLINE';
        const url = ok(address) + path;
        return this.httpAdapter.getWithBinaryData(url);
    }


    /**
     * Posts a file for the current project
     *
     * @param path should start with /
     * @throws NOT_ONLINE. Make sure checking isOn() before calling this method
     */
    public post(path: string, contents: any) {

        const address = this.getAddress();
        if (!isOk(address) || !this.mySyncIsOn()) throw 'NOT_ONLINE';
        const url = ok(address) + path;
        return this.httpAdapter.postBinaryData(url, contents);
    }


    private mySyncIsOn = () => {

        const project = this.settingsProvider.getSettings().selectedProject;
        const syncSource = this.settingsProvider.getSettings().syncTargets[project];
        return syncSource.isSyncActive;
    }


    /*
     * @returns url, ending slash not included
     */
    private getAddress(): Maybe<string> {

        const settings = this.settingsProvider.getSettings();
        const project = settings.selectedProject;
        if (project === 'test') return nothing();

        const syncSource = settings.syncTargets[project];
        if (!syncSource) return nothing();

        const address = syncSource.address;
        // TODO do not rewrite the adress but instead store the address parts in syncSource.address
        const protocol = address.startsWith('https') ? 'https' : 'http';
        const addressSegment = address
            .replace('https://', '')
            .replace('http://', '');
        const syncUrl = protocol + '://' + project + ':' + syncSource.password + '@' + addressSegment + '/files/' + project;
        console.log(syncUrl)
        return just(syncUrl);
    }
}
