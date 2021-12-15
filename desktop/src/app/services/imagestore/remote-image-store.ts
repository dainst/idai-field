import { Injectable } from '@angular/core';
import { ImageVariant } from 'idai-field-core';
import { SettingsProvider } from '../settings/settings-provider';

const axios = typeof window !== 'undefined' ? window.require('axios') : require('axios');

@Injectable()
export class RemoteImageStore{

    constructor(private settingsProvider: SettingsProvider) {}

    public store(imageId: string, data: Buffer, project: string) {
        // TODO: Run POST request.
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
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${btoa(project + ':' + password)}`
            }
        });

        return response.data;
    }
}
