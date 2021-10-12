import { Injectable } from '@angular/core';
import { ChangesStream, Named, ProjectConfiguration, Document, PouchdbDatastore, CategoryConverter } from 'idai-field-core';
import { SettingsProvider } from '../settings/settings-provider';
import { Filestore } from './filestore';
import { RemoteFilestore } from './remote-filestore';

type Paths = [string, string];

type Services = {
    readFile: (path: string) => any,
    writeFile: (path: string, contents: any) => void,
    get: (url: string) => Promise<any>,
    post: (url: string, data: any) => Promise<void>
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
                remoteFilestore: RemoteFilestore,
                settingsProvider: SettingsProvider,
                projectConfiguration: ProjectConfiguration,
                categoryConverter: CategoryConverter) {

        // TODO pass this in as parameter; maybe make a RemoteFilestore to encapsulate HttpAdapter access, analogous to Filestore
        const services: Services = {
            readFile: filestore.readFile,
            writeFile: filestore.writeFile,
            get: remoteFilestore.get,
            post: remoteFilestore.post,
        };

        // TODO maybe we can do it only on creation, not on every change
        datastore.changesNotifications().subscribe(document => {
            const doc = categoryConverter.convert(document);

            if (!ImageChangesStream.isImageDocument(projectConfiguration, doc)) return;
            if (!remoteFilestore.isOn()) return;

            const paths = ImageChangesStream.getPaths(document)
            if (!ChangesStream.isRemoteChange(doc, settingsProvider.getSettings().username)) {
                ImageChangesStream.postImages(paths, services);
            } else {
                ImageChangesStream.fetchImages(paths, services);
            }
        });
    }


    private static async postImages([hiresPath, loresPath]: Paths, {readFile, post}: Services) {

        await post(hiresPath, readFile(hiresPath));
        await post(loresPath, readFile(loresPath));
    }


    private static async fetchImages([hiresPath, loresPath]: Paths,
                                     {writeFile, get}: Services) {

        writeFile(hiresPath, await get(hiresPath));
        writeFile(loresPath, await get(loresPath));
    }


    private static getPaths(document: Document): Paths {

        return [
            '/' + document.resource.id,
            '/thumbs/' + document.resource.id,
        ]
    }


    private static isImageDocument(projectConfiguration: ProjectConfiguration, document: Document) {

        return projectConfiguration
            .getImageCategories()
            .map(Named.toName)
            .includes(document.resource.category);
    }
}
