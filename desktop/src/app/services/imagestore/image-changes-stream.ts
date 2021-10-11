import { Injectable } from '@angular/core';
import { ChangesStream, Named, ProjectConfiguration, Document } from 'idai-field-core';
import { Settings } from '../settings/settings';
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

        const [syncUrl, imagestoreProjectPath] =
            ImageChangesStream.extract(settingsProvider.getSettings());

        changesStream.remoteChangesNotifications().subscribe(next => {
            if (!projectConfiguration.getImageCategories().map(Named.toName)
                .includes(next.resource.category)) return;

            ImageChangesStream.go(syncUrl, imagestoreProjectPath, next);
        });
    }


    private static go(syncUrl: string, imagestoreProjectPath: string, next: Document) {

        const hiresPath = imagestoreProjectPath + next.resource.id;
        const loresPath = imagestoreProjectPath + 'thumbs/' + next.resource.id;

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
    }


    private static extract(settings: Settings) {

        const project = settings.selectedProject;
        const syncSource = settings.syncTargets[project];

        const address = 'localhost'; // TODO should be derived from syncSource.address
        const protocol = 'http'; // TODO be able to deal with both http and https
        const syncUrl = protocol + '://' + project + ':' + syncSource.password
            + '@' + address + '/files/' + project + '/';

        const imagestorePath = settings.imagestorePath;
        const imagestoreProjectPath = imagestorePath + project + '/';

        return [syncUrl, imagestoreProjectPath];
    }
}
