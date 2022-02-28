import {
    ImageStore,
    ImageVariant,
    PouchdbDatastore
} from 'idai-field-core';

import { to } from 'tsfun';

const isThumbBroken = (data: Blob|any|undefined) => data === undefined || data.size === 0 || data.size === 2;

/**
 * This is a migration function for upgrading the client version 2 to 3, which moved thumbnail data from couch/pouchdb to
 * the file system.
 */
export const copyThumbnailsFromDatabase = async (
    project: string,
    pouchDatastore: PouchdbDatastore,
    imageStore: ImageStore
): Promise<void> => {

    const thumbnailCount = Object.keys(await imageStore.getFileInfos(project, [ImageVariant.THUMBNAIL])).length;
    if (thumbnailCount !== 0) {
        console.log('Found thumbnails in image store directory, not copying from database.');
        return;
    } else {
        console.log('Copying thumbnails from database to filesystem.');
    }

    const options = {
        include_docs: true,
        attachments: true,
        binary: true
    };

    const db = pouchDatastore.getDb();

    const imageDocuments = (await db.allDocs(options)).rows.map(to('doc'));

    for (const imageDocument of imageDocuments) {
        if (imageDocument._attachments?.thumb && !isThumbBroken(imageDocument._attachments.thumb.data)) {
            try {
                const data = Buffer.from(await imageDocument._attachments.thumb.data.arrayBuffer());
                await imageStore.store(imageDocument.resource.id, data, project, ImageVariant.THUMBNAIL);
            } catch (err) {
                console.error('Failed to save thumbnail for image: ' + imageDocument.resource.id, err);
            }
        }
    }
}