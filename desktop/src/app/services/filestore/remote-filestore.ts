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


    public isOn = () => isOk(this.getLoginData()) && this.mySyncIsOn();


    /**
     * Get a file for the current project.
     *
     * @param path should start with /
     * @throws NOT_ONLINE. Make sure checking isOn() before calling this method
     */
    public get(path: string) {

        const maybeRequestContext = this.getLoginData();
        if (!isOk(maybeRequestContext) || !this.mySyncIsOn()) throw 'NOT_ONLINE';
        const loginData  = ok(maybeRequestContext);
        const {url, user: project} = loginData;
        loginData.url = url + '/files/' + project + path;
        return this.httpAdapter.getWithBinaryData(loginData);
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


    private getLoginData(): Maybe<HttpAdapter.BasicAuthRequestContext> {

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

        return just({
            protocol: protocol,
            user: project,
            pass: syncSource.password,
            url: addressSegment
        });
    }
}
