import { Injectable } from '@angular/core';
import { ImageVariant, RemoteImageStoreInterface, FileInfo } from 'idai-field-core';
import { SettingsProvider } from '../settings/settings-provider';

const axios = typeof window !== 'undefined' ? window.require('axios') : require('axios');

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;
const fork = typeof window !== 'undefined' ? window.require('child_process').fork : require('child_process').fork;


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
    public async store(uuid: string, data: Buffer, project: string, type?: ImageVariant): Promise<any> {
        try {
            const settings = this.settingsProvider.getSettings();
            const syncSource = settings.syncTargets[project];
            if (!syncSource || !syncSource.isSyncActive) return;

            const address = syncSource.address;
            const password = syncSource.password;

            const params = (type) ? { type } : {};

            return this.workerRequest({
                method: 'put',
                url: address + '/files/' + project + '/' + uuid,
                params,
                data,
                headers: {
                    'Content-Type': 'image/x-www-form-urlencoded',
                    Authorization: `Basic ${btoa(project + ':' + password)}`
                }
            });
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

            Promise.reject(error);
        }
    }

    /**
     * Removes the image from the remote target.
     * @param uuid the identifier for the image to be removed
     * @param project the project's name
     */
    public async remove(uuid: string, project: string): Promise<any> {
        const settings = this.settingsProvider.getSettings();

        const syncSource = settings.syncTargets[project];
        if (!syncSource || !syncSource.isSyncActive) return {};

        const address = syncSource.address;
        const password = syncSource.password;

        return this.workerRequest({
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
    ): Promise<{ [uuid: string]: FileInfo}> {

        const settings = this.settingsProvider.getSettings();

        const syncSource = settings.syncTargets[project];
        if (!syncSource || !syncSource.isSyncActive) return {};

        const address = syncSource.address;
        const password = syncSource.password;

        const params = (type) ? { type } : {};

        return this.workerRequest({
            method: 'get',
            url: address + '/files/' + project,
            params,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${btoa(project + ':' + password)}`
            }
        }).then((response) => {
            return response.data;
        }).catch((error) => {
            console.error(error);
            return {};
        });
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
        if (!syncSource || !syncSource.isSyncActive) return null;

        const address = syncSource.address;
        const password = syncSource.password;

        const params = (type) ? { type } : {};

        return this.workerRequest({
            method: 'get',
            url: address + '/files/' + project + '/' + uuid,
            params,
            responseType: 'arraybuffer',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${btoa(project + ':' + password)}`
            }
        });
    }

    private workerRequest(parameters): Promise<any>{

        return new Promise((resolve, reject) => {
            const worker = fork(
                remote.app.getAppPath() + '/worker/http-request.js',
                [],
                {
                    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
                }
            );

            // worker.stdout.on('data', (d) => {
            //     console.log('[stdout-renderer-fork] ' + d.toString());
            // });
            worker.stderr.on('data', (d) => {
                console.log('[http-request-worker] ' + d.toString());
            });

            worker.on('message', (res: any) => {
                if ('error' in res) {
                    reject(res);
                } else {
                    resolve(res);
                }
            });

            worker.send(parameters);
        });
    }
}
