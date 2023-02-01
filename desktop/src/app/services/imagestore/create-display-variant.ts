import { ImageDocument, ImageStore, ImageVariant } from 'idai-field-core';
import { ImageManipulation } from './image-manipulation';


/**
 * @author Thomas Kleinke
 * 
 * @returns buffer data of the created display variant or undefined if no display variant is needed
 */
export async function createDisplayVariant(document: ImageDocument, imagestore: ImageStore,
                                           originalData?: Buffer): Promise<Buffer|undefined> {

    const imageId: string = document.resource.id;
    const fileExtension: string = ImageDocument.getOriginalFileExtension(document);
    const width: number = document.resource.width;
    const height: number = document.resource.height;

    if (!ImageManipulation.needsDisplayVersion(width, height, fileExtension)) return;

    originalData = originalData ?? await imagestore.getData(imageId, ImageVariant.ORIGINAL);
    const displayData: Buffer = await ImageManipulation.createDisplayImage(originalData, width, height, fileExtension);

    if (displayData) {
        await imagestore.store(imageId, displayData, undefined, ImageVariant.DISPLAY);
        return displayData;
    }
};
