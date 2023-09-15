import { Injectable } from '@angular/core';
import { ImageVariant, RemoteImageStoreInterface, FileInfo, base64Encode } from 'idai-field-core';
import { M } from '../../components/messages/m';
import { Messages } from '../../components/messages/messages';
import { SettingsProvider } from '../settings/settings-provider';
import { SyncTarget } from '../settings/sync-target';

const axios = typeof window !== 'undefined' ? window.require('axios') : require('axios');


@Injectable()
export class RemoteImageStore implements RemoteImageStoreInterface {

    constructor(
        private settingsProvider: SettingsProvider,
        private messages: Messages
    ) { }


    /**
     * Remotely store data with the provided id.
     * @param uuid the identifier for the data
     * @param data the binary data to be stored
     * @param project the project's name
     * @param type (optional) image's type. By convention, a missing `type` parameter will be
     * interpreted as {@link ImageVariant.ORIGINAL} by the syncing target.
     */
    public async store(uuid: string, data: Buffer, project: string, type: ImageVariant): Promise<number> {

        const settings = this.settingsProvider.getSettings();

        const syncTarget = settings.syncTargets[project];
        const address = SyncTarget.getAddress(syncTarget);
        const password = syncTarget.password;

        const params = type ? { type } : {};

        return axios({
            method: 'put',
            url: address + '/files/' + project + '/' + uuid,
            params,
            data,
            headers: {
                'Content-Type': 'image/x-www-form-urlencoded',
                Authorization: `Basic ${base64Encode(project + ':' + password)}`
            }
        })
        .then((response) => {
            return response.status;
        })
        .catch((error) => {
            if (error.response.status === 409) {
                this.messages.add([M.REMOTEIMAGESTORE_WARNING_LARGE_FILE_UPLOAD_BLOCKED_BY_PEER]);
                return 409;
            } else {
                throw error;
            }
        });

    }

    /**
     * Removes the image from the remote target.
     * @param uuid the identifier for the image to be removed
     * @param project the project's name
     */
    public async remove(uuid: string, project: string) {

        const settings = this.settingsProvider.getSettings();

        const syncTarget = settings.syncTargets[project];
        const address = SyncTarget.getAddress(syncTarget);
        const password = syncTarget.password;

        await axios({
            method: 'delete',
            url: address + '/files/' + project + '/' + uuid,
            headers: {
                Authorization: `Basic ${base64Encode(project + ':' + password)}`
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
    public async getFileInfos(project: string, types: ImageVariant[]): Promise<{ [uuid: string]: FileInfo }> {

        const settings = this.settingsProvider.getSettings();

        const syncTarget = settings.syncTargets[project];
        const url = SyncTarget.getAddress(syncTarget);
        const password = syncTarget.password;

        return this.runFileInfoQuery(url, password, project, types);
    }


    public async getFileInfosUsingCredentials(url: string, password: string, project: string,
                                              types: ImageVariant[]): Promise<{ [uuid: string]: FileInfo }> {

        return this.runFileInfoQuery(url, password, project, types);
    }


    private async runFileInfoQuery(url: string, password: string, project: string, types: ImageVariant[]) {

        const response = await axios({
            method: 'get',
            url: url + '/files/' + project,
            params: { types },
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${base64Encode(project + ':' + password)}`
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
    public async getData(uuid: string, type: ImageVariant, project: string): Promise<Buffer> {

        const settings = this.settingsProvider.getSettings();

        const syncTarget = settings.syncTargets[project];
        const url = SyncTarget.getAddress(syncTarget);
        const password = syncTarget.password;

        return this.runDataQuery(url, password, project, uuid, type);
    }


    public async getDataUsingCredentials(url: string, password: string, uuid: string, type: ImageVariant,
                                         project: string): Promise<Buffer | null> {

        return this.runDataQuery(url, password, project, uuid, type);
    }


    private async runDataQuery(url: string, password: string, project: string, uuid: string, type: ImageVariant): Promise<Buffer> {

        const response = await axios({
            method: 'get',
            url: url + '/files/' + project + '/' + uuid,
            params: { type },
            responseType: 'arraybuffer',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${base64Encode(project + ':' + password)}`
            }
        });

        return Buffer.from(response.data);
    }

}
