import { Injectable } from '@angular/core';
import { ImageVariant, RemoteImageStoreInterface } from 'idai-field-core';
import { SettingsProvider } from '../settings/settings-provider';

const axios = typeof window !== 'undefined' ? window.require('axios') : require('axios');

@Injectable()
export class RemoteImageStore implements RemoteImageStoreInterface {

    constructor(private settingsProvider: SettingsProvider) {}


    /**
     * Remotely store data with the provided id.
     * @param uuid the identifier for the data
     * @param data the binary data to be stored
     * @param project the project's name
     * @param type (optional) image's type. By convention, a missing `type` parameter will be
     * interpreted as {@link ImageVariant.ORIGINAL} by the syncing target.
     */
    public async store(uuid: string, data: Buffer, project: string, type?: ImageVariant) {

        try {
            const settings = this.settingsProvider.getSettings();
            const syncSource = settings.syncTargets[project];
            if (!syncSource) return;

            const address = syncSource.address;
            const password = syncSource.password;

            const params = (type) ? { type } : {};
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

    /**
     * Removes the image from the remote target.
     * @param uuid the identifier for the image to be removed
     * @param project the project's name
     */
    public async remove(uuid: string, project: string) {

        const settings = this.settingsProvider.getSettings();

        const syncSource = settings.syncTargets[project];
        if (!syncSource) return {};

        const address = syncSource.address;
        const password = syncSource.password;

        const response = await axios({
            method: 'delete',
            url: address + '/files/' + project + '/' + uuid,
            headers: {
                Authorization: `Basic ${btoa(project + ':' + password)}`
            }
        });
    }

    /**
     * Returns all known images and lists their available variants for the remote sync target.
     * @param project the project's name
     * @param types List of variants one wants returned. If an empty list is provided, all images no matter which variants
     * are returned, otherwise only images with the requested variants are returned.
     * @returns Dictionary where each key represents an image UUID and each value is a list of the image's known variants.
     */
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

    /**
     * Returns the raw Buffer data for the requested image on the sync target.
     * @param uuid the identifier for the image
     * @param type variant type of the image
     * @param project the project's name
     */
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
