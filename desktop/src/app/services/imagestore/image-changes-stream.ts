import { Injectable } from '@angular/core';
import { ChangesStream, Named, ProjectConfiguration, Document, PouchdbDatastore, CategoryConverter } from 'idai-field-core';
import { SettingsProvider } from '../settings/settings-provider';
import { Filestore } from './filestore';
import { RemoteFilestore } from './remote-filestore';

type Paths = [string, string];


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

        // TODO maybe we can do it only on creation, not on every change
        datastore.changesNotifications().subscribe(document => {
            const doc = categoryConverter.convert(document);

            if (!ImageChangesStream.isImageDocument(projectConfiguration, doc)) return;
            if (!remoteFilestore.isOn()) return;

            const paths = ImageChangesStream.getPaths(document)
            if (!ChangesStream.isRemoteChange(doc, settingsProvider.getSettings().username)) {
                ImageChangesStream.postImages(paths, filestore, remoteFilestore);
            } else {
                ImageChangesStream.fetchImages(paths, filestore, remoteFilestore);
            }
        });
    }


    private static async postImages([hiresPath, loresPath]: Paths,
                                    filestore: Filestore,
                                    remoteFilestore: RemoteFilestore) {

        await remoteFilestore.post(hiresPath, filestore.readFile(hiresPath));
        await remoteFilestore.post(loresPath, filestore.readFile(loresPath));
    }


    private static async fetchImages([hiresPath, loresPath]: Paths,
                                     filestore: Filestore,
                                     remoteFilestore: RemoteFilestore) {

        filestore.writeFile(hiresPath, await remoteFilestore.get(hiresPath));
        filestore.writeFile(loresPath, await remoteFilestore.get(loresPath));
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
