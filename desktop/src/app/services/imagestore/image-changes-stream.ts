import { Injectable } from '@angular/core';
import { ChangesStream, Named, ProjectConfiguration } from 'idai-field-core';
import { SettingsProvider } from '../settings/settings-provider';

const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');
const http = typeof window !== 'undefined' ? window.require('http') : require('http');


@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class ImageChangesStream {

    constructor(changesStream: ChangesStream,
                settingsProvider: SettingsProvider,
                projectConfiguration: ProjectConfiguration) {

        const settings = settingsProvider.getSettings();
        const imagestorePath = settings.imagestorePath;
        const project = settings.selectedProject;
        const syncSource = settings.syncTargets[project];
        const syncUrl = 'http://' + project + ':' + syncSource.password
            + '@' + syncSource.address + '/files/' + project + '/';

        changesStream.remoteChangesNotifications().subscribe(next => {

            if (!projectConfiguration.getImageCategories().map(Named.toName)
                .includes(next.resource.category)) return;

            const hiresPath = imagestorePath + project + '/' + next.resource.id;
            const loresPath = imagestorePath + project + '/thumbs/' + next.resource.id;

            if (!fs.existsSync(hiresPath)) {
                console.log('hires image does not yet exist', hiresPath);
                // TODO fetch from remote
                http.get(syncUrl, (res: any) => {
                    // TODO impl
                });
            }
            if (!fs.existsSync(loresPath)) {
                console.log('lores image does not yet exist', loresPath);
                // TODO fetch from remote
                http.get(syncUrl, (res: any) => {
                    // TODO impl
                });
            }
        });
    }
}
