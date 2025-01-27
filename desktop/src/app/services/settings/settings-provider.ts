import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { set } from 'tsfun';
import { ObjectUtils, Name, ObserverUtil } from 'idai-field-core';
import { Settings } from './settings';
import { SettingsSerializer } from './settings-serializer';

const remote = window.require('@electron/remote');


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class SettingsProvider {

    private settingsSerializer: SettingsSerializer = new SettingsSerializer();
    private settings: Settings;
    private settingsChangesObservers: Array<Observer<Settings>> = [];


    constructor() {}
    

    public settingsChangesNotifications = (): Observable<Settings> =>
        ObserverUtil.register(this.settingsChangesObservers);
    

    /**
     * Retrieve the current settings.
     * Returns a clone of the settings object in order to prevent the settings
     * object from being changed without explicitly saving the settings.
     * @returns {Settings} the current settings
     */
    public getSettings(): Settings {

        const settings = ObjectUtils.jsonClone(this.settings);
        settings.selectedProject =
            settings.dbs && settings.dbs.length > 0
                ? settings.dbs[0]
                : 'test';

        return settings;
    }


    public async setSettingsAndSerialize(settings: Settings) {

        this.settings = settings;
        await this.serialize();
        if (remote) remote.getGlobal('updateConfig')(this.settings);
    }


    public async addProjectAndSerialize(project: Name) {

        this.settings.dbs = set(this.settings.dbs.concat([project]));
        await this.serialize();
        if (remote) remote.getGlobal('updateConfig')(this.settings);
    }


    public async selectProjectAndSerialize(project: Name) {

        this.settings.dbs = set([project].concat(this.settings.dbs));
        await this.serialize(false);
    }


    public async deleteProjectAndSerialize(project: Name) {

        this.settings.dbs.splice(this.settings.dbs.indexOf(project), 1);
        delete this.settings.syncTargets[project];
        await this.serialize();
        if (remote) remote.getGlobal('updateConfig')(this.settings);
    }


    /**
     * Initializes settings to default values
     * @param newSettings provided settings
     * @returns {Settings} settings with added default settings
     */
    public setSettings(newSettings: Settings) {

        const settings = ObjectUtils.jsonClone(newSettings);

        if (settings.username) settings.username = settings.username.replace(/ +/g, ' ').trim();
        if (!settings.dbs || settings.dbs.length === 0) settings.dbs = ['test'];
        if (!settings.isSyncActive) settings.isSyncActive = false;
        if (settings.hostPassword === undefined) settings.hostPassword = SettingsProvider.generatePassword();

        if (settings.imagestorePath) {
            let path: string = settings.imagestorePath;
            if (path.substr(-1) != '/') path += '/';
            settings.imagestorePath = path;
        } else {
            if (remote.app) {
                settings.imagestorePath = remote.app.getPath('appData') + '/'
                    + remote.app.getName() + '/imagestore/';
            }
        }
        this.settings = settings;
    }


    private async serialize(notifyObservers: boolean = true) {

        await this.settingsSerializer.store(this.settings);
        if (notifyObservers) ObserverUtil.notify(this.settingsChangesObservers, this.getSettings());
    }


    private static generatePassword(): string {

        const length: number = 8;
        const charset: string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

        let password: string = '';
        for (let i = 0, n = charset.length; i < length; ++i) {
            password += charset.charAt(Math.floor(Math.random() * n));
        }

        return password;
    }
}
