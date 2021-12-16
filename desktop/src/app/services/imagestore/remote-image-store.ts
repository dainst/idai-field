import { Injectable } from '@angular/core';
import { ImageVariant, RemoteImageStoreInterface } from 'idai-field-core';
import { SettingsProvider } from '../settings/settings-provider';

const axios = typeof window !== 'undefined' ? window.require('axios') : require('axios');

@Injectable()
export class RemoteImageStore implements RemoteImageStoreInterface {

    constructor(private settingsProvider: SettingsProvider) {}

    public async store(uuid: string, data: Buffer, project: string, type?: ImageVariant) {
        try {
            const settings = this.settingsProvider.getSettings();
            const syncSource = settings.syncTargets[project];
            if (!syncSource) return;

            const address = syncSource.address;
            const password = syncSource.password;

            const params = (type) ? { type } : {};
            console.log('POSTing:');
            console.log(data);
            const response = await axios({
                method: 'post',
                url: address + '/files/' + project + '/' + uuid,
                params,
                data,
                headers: {
                    'Content-Type': 'image/x-www-form-urlencoded',
                    Authorization: `Basic ${btoa(project + ':' + password)}`
                }
            });

            console.log(response);
        } catch (error) {
            if (error.response) {
                console.error(error.response.data);
                console.error(error.response.status);
                console.error(error.response.headers);
              } else if (error.request) {
                console.error(error.request);
              } else {
                console.error(error.message);
              }
        }
    }

    public async getFileIds(
        project: string,
        type?: ImageVariant
    ): Promise<{ [uuid: string]: ImageVariant[]}> {

        const settings = this.settingsProvider.getSettings();

        const syncSource = settings.syncTargets[project];
        if (!syncSource) return {};

        const address = syncSource.address;
        const password = syncSource.password;

        const params = (type) ? { type } : {};

        const response = await axios({
            method: 'get',
            url: address + '/files/' + project,
            params,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${btoa(project + ':' + password)}`
            }
        });

        return response.data;
    }

    public async getData(uuid: string, type: ImageVariant, project: string): Promise<Buffer|null> {
        const settings = this.settingsProvider.getSettings();

        const syncSource = settings.syncTargets[project];
        if (!syncSource) return null;

        const address = syncSource.address;
        const password = syncSource.password;

        const params = (type) ? { type } : {};

        const response = await axios({
            method: 'get',
            url: address + '/files/' + project + '/' + uuid,
            params,
            responseType: 'arraybuffer',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${btoa(project + ':' + password)}`
            }
        });

        return Buffer.from(response.data);
    }
}
