import { Injectable } from '@angular/core';
import { ChangesStream, Named, ProjectConfiguration, Document, PouchdbDatastore, CategoryConverter, Resource } from 'idai-field-core';
import { SettingsProvider } from '../settings/settings-provider';
import { Filestore } from '../filestore/filestore';
import { RemoteFilestore } from '../filestore/remote-filestore';


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

            if (!ChangesStream.isRemoteChange(doc, settingsProvider.getSettings().username)) {
                ImageChangesStream.postImages(
                    document.resource.id, filestore, remoteFilestore, settingsProvider.getSettings().selectedProject);
            } else {
                ImageChangesStream.fetchImages(
                    document.resource.id, filestore, remoteFilestore, settingsProvider.getSettings().selectedProject);
            }
        });
    }


    private static async postImages(id: Resource.Id,
                                    filestore: Filestore,
                                    remoteFilestore: RemoteFilestore,
                                    project: string) {

        await remoteFilestore.post('/' + id, filestore.readFile('/' + project + '/' + id));
        await remoteFilestore.post('/thumbs/' + id , filestore.readFile('/' + project + '/thumbs/' + id));
    }


    private static async fetchImages(id: Resource.Id,
                                     filestore: Filestore,
                                     remoteFilestore: RemoteFilestore,
                                     project: string) {

        filestore.writeFile('/' + project + '/' + id, await remoteFilestore.get('/' + id));
        filestore.writeFile('/' + project + '/thumbs/' + id, await remoteFilestore.get('/thumbs/' + id));
    }


    private static isImageDocument(projectConfiguration: ProjectConfiguration, document: Document) {

        return projectConfiguration
            .getImageCategories()
            .map(Named.toName)
            .includes(document.resource.category);
    }
}
