import { Injectable } from '@angular/core';
import { Maybe, isOk, ok, just, nothing } from 'tsfun';
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

        const account = ImageChangesStream.extract(settingsProvider.getSettings());
        if (!isOk(account)) return;
        const [syncUrl, imagestoreProjectPath] = ok(account);

        changesStream.remoteChangesNotifications().subscribe(next => {
            if (!projectConfiguration.getImageCategories().map(Named.toName)
                .includes(next.resource.category)) return;

            ImageChangesStream.go(syncUrl, imagestoreProjectPath, next);
        });
    }


    private static go(syncUrl: string, imagestoreProjectPath: string, next: Document) {

        const hiresPath = imagestoreProjectPath + next.resource.id;
        if (!fs.existsSync(hiresPath)) http.get(syncUrl + next.resource.id, ImageChangesStream.write(hiresPath));
        const loresPath = imagestoreProjectPath + 'thumbs/' + next.resource.id;
        if (!fs.existsSync(loresPath)) http.get(syncUrl + '/thumbs/' + next.resource.id, ImageChangesStream.write(loresPath));
    }


    private static write(path: string) {

        // https://stackoverflow.com/a/49600958
        return (res: any) => {

            res.setEncoding('binary');
            const chunks = [];
            res.on('data', function(chunk) {
                chunks.push(Buffer.from(chunk, 'binary'));
            });
            res.on('end', function() {
                fs.writeFileSync(path, Buffer.concat(chunks));
            });
        }
    }


    private static extract(settings: Settings): Maybe<[string, string]> {

        const project = settings.selectedProject;
        if (project === 'test') return nothing();

        const syncSource = settings.syncTargets[project];
        if (!syncSource) return nothing();

        const address = 'localhost'; // TODO should be derived from syncSource.address
        const protocol = 'http'; // TODO be able to deal with both http and https
        const syncUrl = protocol + '://' + project + ':' + syncSource.password
            + '@' + address + '/files/' + project + '/';

        const imagestorePath = settings.imagestorePath;
        const imagestoreProjectPath = imagestorePath + project + '/';

        return just([syncUrl, imagestoreProjectPath]);
    }
}
