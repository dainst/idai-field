import { Injectable } from '@angular/core';
import { Maybe, isOk, ok, just, nothing } from 'tsfun';
import { ChangesStream, Named, ProjectConfiguration, Document, PouchdbDatastore, CategoryConverter } from 'idai-field-core';
import { Settings } from '../settings/settings';
import { SettingsProvider } from '../settings/settings-provider';
import { HttpAdapter } from './http-adapter';
import { Filestore } from './filestore';

type BasePaths = [string, string];
type Paths = [string, string, string, string];

type Services = {
    readFile: (path: string) => any,
    fileExists: (path: string) => boolean,
    writeFile: (path: string, contents: any) => void,
    getWithBinaryData: (url: string) => Promise<any>,
    postBinaryData: (url: string, data: any) => Promise<void>
}

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
                filestore: Filestore,
                settingsProvider: SettingsProvider,
                projectConfiguration: ProjectConfiguration,
                categoryConverter: CategoryConverter) {

        // TODO pass this in as parameter; maybe make a RemoteFilestore to encapsulate HttpAdapter access, analogous to Filestore
        const services: Services = {
            readFile: filestore.readFile,
            fileExists: filestore.fileExists,
            writeFile: filestore.writeFile,
            getWithBinaryData: HttpAdapter.getWithBinaryData,
            postBinaryData: HttpAdapter.postBinaryData,
        };

        const maybeBasePaths = ImageChangesStream.extractBasePaths(settingsProvider.getSettings());
        if (!isOk(maybeBasePaths)) return;
        const basePaths = ok(maybeBasePaths);

        // TODO maybe we can do it only on creation, not on every change
        datastore.changesNotifications().subscribe(document => {
            const doc = categoryConverter.convert(document);

            if (!ImageChangesStream.isImageDocument(projectConfiguration, doc)) return;
            if (!ImageChangesStream.mySyncIsOn(settingsProvider.getSettings())) return;

            const paths = ImageChangesStream.getPaths(basePaths, document)
            if (!ChangesStream.isRemoteChange(doc, settingsProvider.getSettings().username)) {
                ImageChangesStream.postImages(paths, services);
            } else {
                ImageChangesStream.fetchImages(paths, services);
            }
        });
    }


    private static async postImages([hiresPath, hiresUrl, loresPath, loresUrl]: Paths, {readFile, postBinaryData}: Services) {

        await postBinaryData(readFile(hiresPath), hiresUrl);
        await postBinaryData(readFile(loresPath), loresUrl);
    }


    private static async fetchImages([hiresPath, hiresUrl, loresPath, loresUrl]: Paths,
                                     {writeFile, fileExists, getWithBinaryData}: Services) {

        if (!fileExists(hiresPath)) writeFile(hiresPath, await getWithBinaryData(hiresUrl));
        if (!fileExists(loresPath)) writeFile(loresPath, await getWithBinaryData(loresUrl));
    }


    private static extractBasePaths(settings: Settings): Maybe<BasePaths> {

        const project = settings.selectedProject;
        if (project === 'test') return nothing();

        const syncSource = settings.syncTargets[project];
        if (!syncSource) return nothing();

        const address = syncSource.address;
        const protocol = 'http'; // TODO be able to deal with both http and https
        const syncUrl = protocol + '://' + project + ':' + syncSource.password
            + '@' + address + '/files/' + project + '/';

        const projectPath = project + '/';

        return just([syncUrl, projectPath]);
    }


    private static mySyncIsOn(settings: Settings) {

        const project = settings.selectedProject;
        const syncSource = settings.syncTargets[project];
        return syncSource.isSyncActive;
    }


    private static getPaths([syncUrl, projectPath]: BasePaths, document: Document): Paths {

        return [
            projectPath + document.resource.id,
            syncUrl + document.resource.id,
            projectPath + 'thumbs/' + document.resource.id,
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
