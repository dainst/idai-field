import { Datastore, ImageDocument, ImageStore, ImageVariant } from 'idai-field-core';
import { MD } from '../../../components/messages/md';
import { getErrorMessage } from './util/get-error-message';
import { Settings } from '../../settings/settings';


/**
 * @author Thomas Kleinke
 */
export async function exportFile(request: any, response: any, datastore: Datastore, imageStore: ImageStore,
                                 settings: Settings, messagesDictionary: MD) {

    try {
        const result: Datastore.FindResult = await datastore.find({
            constraints: { 'identifier:match': request.params.identifier }
        });
        if (!result.totalCount) throw 'Could not find image: ' + request.params.identifier;

        const document: ImageDocument = result.documents[0] as ImageDocument;
        
        if (request.params.format === 'worldFile') {
            const worldFileContent: string = ImageDocument.getWldFileContent(document);
            response.header('Content-Type', 'text/plain').status(200).send(worldFileContent);
        } else if (request.params.format === 'image') {
            const data: any = await imageStore.getData(
                document.resource.id, ImageVariant.ORIGINAL, settings.selectedProject
            );
            response.header('Content-Type', getMimeType(document)).status(200).send(data);
        } else {
            throw 'Invalid format: ' + request.params.format;
        }
    
    } catch (err) {
        response.status(400).send({ error: getErrorMessage(err, messagesDictionary) });
    }
}


function getMimeType(document: ImageDocument): string {

    switch (ImageDocument.getOriginalFileExtension(document)) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'tif':
        case 'tiff':
            return 'image/tiff';
        default:
            return 'image/*';
    }
}
