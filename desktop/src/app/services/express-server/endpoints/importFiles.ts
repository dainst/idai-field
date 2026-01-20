import { ProjectConfiguration } from 'idai-field-core';
import { MD } from '../../../components/messages/md';
import { getErrorMessage } from './util/get-error-message';
import { ImageUploader } from '../../../components/image/upload/image-uploader';
import { ImageMetadata } from '../../imagestore/file-metadata';


/**
 * @author Thomas Kleinke
 */
export async function importFiles(request: any, response: any, projectConfiguration: ProjectConfiguration,
                                  imageUploader: ImageUploader, messagesDictionary: MD) {

    try {
        const filePaths: string[] = request.body.filePaths;
        if (!filePaths?.length) throw 'No file paths specified';

        const parseDraughtsmen: boolean = request.body.readCreatorsFromMetadata === true ? true : false;

        const category: string = request.body.category;
        if (!projectConfiguration.getCategory(category)) throw 'Unconfigured category: ' + request.body.category;

        const metadata: ImageMetadata = { category, draughtsmen: [] };

        const result = await imageUploader.startUpload(filePaths, undefined, metadata, parseDraughtsmen, true);
        result.messages = result.messages.map(message => getErrorMessage(message, messagesDictionary));

        response.status(200).send(result);
    } catch (err) {
        response.status(400).send({ error: getErrorMessage(err, messagesDictionary) });
    }
}
