import { Injectable } from '@angular/core';
import { Maybe, isOk, ok, just, nothing } from 'tsfun';
import { ChangesStream, Named, ProjectConfiguration, Document, PouchdbDatastore, CategoryConverter, Action } from 'idai-field-core';
import { Settings } from '../settings/settings';
import { SettingsProvider } from '../settings/settings-provider';

const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');
const http = typeof window !== 'undefined' ? window.require('http') : require('http');
const axios = typeof window !== 'undefined' ? window.require('axios') : require('axios');

type Paths = [string, string, string, string];


// TODO in image overview, update images when new images come in


@Injectable()
/**
 * Posts or fetches new images on any change to image documents.
 * Acts only if sync is turned on.
 *
 * @author Daniel de Oliveira
 */
export class ImageChangesStream {

    // TODO reinit on runtime changes of sync settings
    constructor(datastore: PouchdbDatastore,
                settingsProvider: SettingsProvider,
                projectConfiguration: ProjectConfiguration,
                categoryConverter: CategoryConverter) {

        const account = ImageChangesStream.extract(settingsProvider.getSettings());
        if (!isOk(account)) return;
        const [syncUrl, imagestoreProjectPath] = ok(account);

        // TODO maybe we can do it only on creation, not on every change
        datastore.changesNotifications().subscribe(document => {
            const doc = categoryConverter.convert(document);

            if (!ImageChangesStream.isImageDocument(projectConfiguration, doc)) return;
            if (!ImageChangesStream.mySyncIsOn(settingsProvider.getSettings())) return;

            const paths = ImageChangesStream.getPaths(syncUrl, imagestoreProjectPath, document)
            if (!ChangesStream.isRemoteChange(doc, settingsProvider.getSettings().username)) {
                ImageChangesStream.postImages(paths);
            } else {
                ImageChangesStream.fetchImages(paths);
            }
        });
    }


    private static async postImages([hiresPath, hiresUrl, loresPath, loresUrl]: Paths) {

        await ImageChangesStream.post(hiresPath, hiresUrl);
        await ImageChangesStream.post(loresPath, loresUrl);
    }


    private static fetchImages([hiresPath, hiresUrl, loresPath, loresUrl]: Paths) {

        if (!fs.existsSync(hiresPath)) http.get(hiresUrl, ImageChangesStream.write(hiresPath));
        if (!fs.existsSync(loresPath)) http.get(loresUrl, ImageChangesStream.write(loresPath));
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


    private static async post(filepath: string, url: string) {

        const buf2 = fs.readFileSync(filepath);
        await axios({
            method: 'post',
            url: url,
            data: Buffer.from(buf2),
            headers: { 'Content-Type': 'application/x-binary' }
        });
    }


    private static extract(settings: Settings): Maybe<[string, string]> {

        const project = settings.selectedProject;
        if (project === 'test') return nothing();

        const syncSource = settings.syncTargets[project];
        if (!syncSource) return nothing();

        const address = syncSource.address;
        const protocol = 'http'; // TODO be able to deal with both http and https
        const syncUrl = protocol + '://' + project + ':' + syncSource.password
            + '@' + address + '/files/' + project + '/';

        const imagestorePath = settings.imagestorePath;
        const imagestoreProjectPath = imagestorePath + project + '/';

        return just([syncUrl, imagestoreProjectPath]);
    }


    private static mySyncIsOn(settings: Settings) {

        const project = settings.selectedProject;
        const syncSource = settings.syncTargets[project];
        return syncSource.isSyncActive;
    }


    private static getPaths(syncUrl: string, imagestoreProjectPath: string, document: Document): Paths {

        return [
            imagestoreProjectPath + document.resource.id,
            syncUrl + document.resource.id,
            imagestoreProjectPath + 'thumbs/' + document.resource.id,
            syncUrl + 'thumbs/' + document.resource.id
        ]
    }


    private static isImageDocument(projectConfiguration: ProjectConfiguration, document: Document) {

        return projectConfiguration
            .getImageCategories()
            .map(Named.toName)
            .includes(document.resource.category);
    }
}
