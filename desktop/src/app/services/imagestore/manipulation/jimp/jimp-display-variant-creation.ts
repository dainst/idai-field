import { ImageDocument, ImageStore, ImageVariant } from 'idai-field-core';
import { ImageManipulation } from '../image-manipulation';
import { JimpImageManipulation } from './jimp-image-manipulation';


/**
 * @author Thomas Kleinke
 */
export module JimpDisplayVariantCreation {

    /**
     * @returns A buffer containing data of a newly created display variant, or undefined if no display variant is needed.
     */
    export async function createDisplayVariant(document: ImageDocument, imagestore: ImageStore,
                                               originalData: Buffer): Promise<Buffer|undefined> {
        
        const imageId: string = document.resource.id;
        const fileExtension: string = ImageDocument.getOriginalFileExtension(document);
        const width: number = document.resource.width;
        const height: number = document.resource.height;

        const image = await JimpImageManipulation.getImageObject(originalData);

        const convertToJpeg: boolean = shouldConvertToJpeg(
            width * height, fileExtension, image
        );

        const resize: boolean = width > ImageManipulation.MAX_DISPLAY_WIDTH 
            || height > ImageManipulation.MAX_DISPLAY_HEIGHT;

        if (!convertToJpeg && !resize) {
            await imagestore.addUseOriginalMarker(imageId);
            return undefined;
        }

        const displayVariantData: Buffer = await JimpImageManipulation.createDisplayImage(
            image, convertToJpeg, resize
        );

        await imagestore.store(imageId, displayVariantData, undefined, ImageVariant.DISPLAY);
        
        return displayVariantData;
    };


    function shouldConvertToJpeg(pixels: number, fileExtension: string, image: any): boolean {

        if (fileExtension.toLowerCase().includes('tif')) return true;
        
        if (fileExtension.toLowerCase().includes('png') && pixels > ImageManipulation.MAX_ORIGINAL_PIXELS) {
            return JimpImageManipulation.isOpaque(image);
        }
    }
}
