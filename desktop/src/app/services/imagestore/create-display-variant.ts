import { ImageDocument, ImageStore, ImageVariant } from 'idai-field-core';
import { ImageManipulation } from './image-manipulation';


/**
 * @author Thomas Kleinke
 * 
 * @returns A buffer containing data of a newly created display variant, or undefined if no display variant is needed.
 */
export async function createDisplayVariant(document: ImageDocument, imagestore: ImageStore,
                                           originalData: Buffer): Promise<Buffer|undefined> {
    
    console.log('Checking if creation of display variant is necessary...');
    const imageId: string = document.resource.id;
    const fileExtension: string = ImageDocument.getOriginalFileExtension(document);
    const width: number = document.resource.width;
    const height: number = document.resource.height;

    const sharpImageHandle = ImageManipulation.getSharpImage(originalData);

    console.log('Checking if conversion to JPG is necessary...');

    const convertToJpeg: boolean = await shouldConvertToJpeg(
        width * height, fileExtension, sharpImageHandle
    );

    const resize: boolean = width > ImageManipulation.MAX_DISPLAY_WIDTH 
        || height > ImageManipulation.MAX_DISPLAY_HEIGHT;

    if (!convertToJpeg && !resize) {
        console.log('Use original file');
        await imagestore.addUseOriginalMarker(imageId);
        return undefined;
    }

    console.log('Creating display image...');

    const displayVariantData: Buffer = await ImageManipulation.createDisplayImage(
        sharpImageHandle, convertToJpeg, resize
    );

    console.log('Storing display image in imagestore...');

    await imagestore.store(imageId, displayVariantData, undefined, ImageVariant.DISPLAY);

    console.log('Finished creating display image');
    return displayVariantData;
};


async function shouldConvertToJpeg(pixels: number, fileExtension: string, sharpLibHandle: any): Promise<boolean> {

    if (fileExtension.toLowerCase().includes('tif')) return true;
    
    if (fileExtension.toLowerCase().includes('png') && pixels > ImageManipulation.MAX_ORIGINAL_PIXELS) {
        return await ImageManipulation.isOpaque(sharpLibHandle);
    }
}
