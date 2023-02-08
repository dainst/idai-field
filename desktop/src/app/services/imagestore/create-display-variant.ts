import { ImageDocument, ImageStore, ImageVariant } from 'idai-field-core';
import { ImageManipulation } from './image-manipulation';


type ImageData = {
    originalData?: Buffer;
    image?: any;
};


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
    const imageData: ImageData = { originalData: originalData };

    const convertToJpeg: boolean = await shouldConvertToJpeg(
        width, height, fileExtension, imageId, imagestore, imageData
    );
    const resize: boolean = shouldResize(width, height);

    if (!convertToJpeg && !resize) return useOriginal(imageId, imagestore, document);

    await loadImage(imageData, imageId, imagestore);
    const displayData: Buffer = await ImageManipulation.createDisplayImage(imageData.image, convertToJpeg, resize);

    if (displayData) {
        await imagestore.store(imageId, displayData, undefined, ImageVariant.DISPLAY);
        return displayData;
    }
};


async function shouldConvertToJpeg(width: number, height: number, fileExtension: string, imageId: string,
                                   imagestore: ImageStore, imageData: ImageData): Promise<boolean> {

    if (fileExtension.toLowerCase().includes('tif')) return true;
    
    if (fileExtension.toLowerCase().includes('png') && width * height > ImageManipulation.MAX_ORIGINAL_PIXELS) {
        await loadImage(imageData, imageId, imagestore);
        return await ImageManipulation.isOpaque(imageData.image);
    }
}


function shouldResize(width: number, height: number) {

    return width > ImageManipulation.MAX_DISPLAY_WIDTH
        || height > ImageManipulation.MAX_DISPLAY_HEIGHT;
}


async function loadImage(imageData: ImageData, imageId: string, imagestore: ImageStore) {

    if (imageData.image) return;

    imageData.originalData = imageData.originalData ?? await imagestore.getData(imageId, ImageVariant.ORIGINAL);
    imageData.image = ImageManipulation.getImage(imageData.originalData);
}


async function useOriginal(imageId: string, imagestore: ImageStore, document: ImageDocument): Promise<undefined> {

    await imagestore.addUseOriginalMarker(imageId);
    return undefined;
}
