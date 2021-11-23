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


    public isOn = () => isOk(this.getRequestContext()) && this.mySyncIsOn();


    /**
     * Get a file for the current project.
     *
     * @param path should start with /
     * @throws NOT_ONLINE. Make sure checking isOn() before calling this method
     */
    public get(path: string) {

        const maybeRequestContext = this.getRequestContext();
        if (!isOk(maybeRequestContext) || !this.mySyncIsOn()) throw 'NOT_ONLINE';
        const requestContext  = ok(maybeRequestContext);
        const {url, user: project} = requestContext;
        requestContext.url = url + '/files/' + project + path;
        return this.httpAdapter.getWithBinaryData(requestContext);
    }


    /**
     * Posts a file for the current project
     *
     * @param path should start with /
     * @throws NOT_ONLINE. Make sure checking isOn() before calling this method
     */
    public post(path: string, binaryContents: any) {

        const maybeRequestContext = this.getRequestContext();
        if (!isOk(maybeRequestContext) || !this.mySyncIsOn()) throw 'NOT_ONLINE';
        const requestContext = ok(maybeRequestContext);
        requestContext.url = requestContext.url + '/files/' + this.settingsProvider.getSettings().selectedProject + path;
        return this.httpAdapter.postBinaryData(requestContext, binaryContents);
    }


    private mySyncIsOn = () => {

        const project = this.settingsProvider.getSettings().selectedProject;
        const syncSource = this.settingsProvider.getSettings().syncTargets[project];
        return syncSource.isSyncActive;
    }


    private getRequestContext(): Maybe<HttpAdapter.RequestContext> {

        const settings = this.settingsProvider.getSettings();
        const project = settings.selectedProject;
        if (project === 'test') return nothing();

        const syncSource = settings.syncTargets[project];
        if (!syncSource) return nothing();

        const address = syncSource.address;

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
