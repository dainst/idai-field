import { Injectable } from '@angular/core';
import { ChangesStream, Named, ProjectConfiguration, Document, PouchdbDatastore, CategoryConverter, Resource } from 'idai-field-core';
import { SettingsProvider } from '../settings/settings-provider';
import { Imagestore, ImageVariant } from 'idai-field-core';
import { RemoteFilestore } from '../filestore/remote-filestore';


// TODO in image overview, update images when new images come in,
// DEPRECATED


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
                imagestore: Imagestore,
                remoteFilestore: RemoteFilestore,
                settingsProvider: SettingsProvider,
                projectConfiguration: ProjectConfiguration,
                categoryConverter: CategoryConverter) {

        // TODO maybe we can do it only on creation, not on every change
        datastore.changesNotifications().subscribe(document => {
            const doc = categoryConverter.convert(document);

            if (!ImageChangesStream.isImageDocument(projectConfiguration, doc)) return;
            if (!remoteFilestore.isOn()) return;

            if (!ChangesStream.isRemoteChange(doc, settingsProvider.getSettings().username)) {
                ImageChangesStream.postImages(
                    document.resource.id, imagestore, remoteFilestore, settingsProvider.getSettings().selectedProject);
            } else {
                ImageChangesStream.fetchImages(
                    document.resource.id, imagestore, remoteFilestore, settingsProvider.getSettings().selectedProject);
            }
        });
    }


    private static async postImages(id: Resource.Id,
                                    imagestore: Imagestore,
                                    remoteFilestore: RemoteFilestore,
                                    project: string) {

        await remoteFilestore.post('/' + id, imagestore.getData(id, ImageVariant.ORIGINAL));
        await remoteFilestore.post('/thumbs/' + id , imagestore.getData(id, ImageVariant.ORIGINAL));
    }


    private static async fetchImages(id: Resource.Id,
                                     imagestore: Imagestore,
                                     remoteFilestore: RemoteFilestore,
                                     project: string) {

        imagestore.store(id, await remoteFilestore.get('/' + id));
        imagestore.store(id, await remoteFilestore.get('/thumbs/' + id));
    }


    private static isImageDocument(projectConfiguration: ProjectConfiguration, document: Document) {

        return projectConfiguration
            .getImageCategories()
            .map(Named.toName)
            .includes(document.resource.category);
    }
}
