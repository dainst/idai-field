import { Injectable } from '@angular/core';
import { Maybe, isOk, ok, just, nothing, update, assoc } from 'tsfun';
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
    public post(path: string, binaryContents: any) {

        const maybeLoginData = this.getLoginData();
        if (!isOk(maybeLoginData) || !this.mySyncIsOn()) throw 'NOT_ONLINE';
        const loginData = ok(maybeLoginData);
        loginData.url = loginData.url + '/files/' + this.settingsProvider.getSettings().selectedProject + path;
        return this.httpAdapter.postBinaryData(loginData, binaryContents);
    }


    private mySyncIsOn = () => {

        const project = this.settingsProvider.getSettings().selectedProject;
        const syncSource = this.settingsProvider.getSettings().syncTargets[project];
        return syncSource.isSyncActive;
    }


    // TODO see below
    private getLoginData(): Maybe<HttpAdapter.BasicAuthRequestContext> {

        const settings = this.settingsProvider.getSettings();
        const project = settings.selectedProject;
        if (project === 'test') return nothing();

        const syncSource = settings.syncTargets[project];
        if (!syncSource) return nothing();
        // TODO remove duplication with getAdress

        const address = syncSource.address;
        // TODO do not rewrite the adress but instead store the address parts in syncSource.address
        const protocol = address.startsWith('https') ? 'https' : 'http';
        const addressSegment = address
            .replace('https://', '')
            .replace('http://', '');

        return just({
            protocol: protocol,
            user: project,
            pass: syncSource.password,
            url: addressSegment
        });
    }


    // TODO remove and use getAddress()
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
        return just(syncUrl);
    }
}
