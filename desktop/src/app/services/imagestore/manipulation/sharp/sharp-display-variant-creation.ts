import { ImageDocument, ImageStore, ImageVariant } from 'idai-field-core';
import { SharpImageManipulation } from './sharp-image-manipulation';
import { ImageManipulation } from '../image-manipulation';


/**
 * @author Thomas Kleinke
 */
export module SharpDisplayVariantCreation {

    /**
     * @returns A buffer containing data of a newly created display variant, or undefined if no display variant is needed.
     */
    export async function createDisplayVariant(document: ImageDocument, imagestore: ImageStore,
                                               originalData: Buffer): Promise<Buffer|undefined> {
        
        const imageId: string = document.resource.id;
        const fileExtension: string = ImageDocument.getOriginalFileExtension(document);
        const sharpImageHandle = SharpImageManipulation.getImageObject(originalData);
        const imageMetadata = await sharpImageHandle.metadata();
        const { width, height } = getImageDimensions(
            document.resource.width,
            document.resource.height,
            imageMetadata.width,
            imageMetadata.height
        );

        const convertToJpeg: boolean = await shouldConvertToJpeg(
            width * height, fileExtension, sharpImageHandle
        );

        const resize: boolean = width > ImageManipulation.MAX_DISPLAY_WIDTH 
            || height > ImageManipulation.MAX_DISPLAY_HEIGHT;

        if (!convertToJpeg && !resize) {
            await imagestore.addUseOriginalMarker(imageId);
            return undefined;
        }

        const displayVariantData: Buffer = await SharpImageManipulation.createDisplayImage(
            sharpImageHandle, convertToJpeg, resize
        );

        await imagestore.store(imageId, displayVariantData, undefined, ImageVariant.DISPLAY);
        
        return displayVariantData;
    };


    async function shouldConvertToJpeg(pixels: number, fileExtension: string, sharpLibHandle: any): Promise<boolean> {

        if (fileExtension.toLowerCase().includes('tif')) return true;
        
        if (fileExtension.toLowerCase().includes('png') && pixels > ImageManipulation.MAX_ORIGINAL_PIXELS) {
            return await SharpImageManipulation.isOpaque(sharpLibHandle);
        }
    }


    function getImageDimensions(resourceWidth: unknown, resourceHeight: unknown,
                                fallbackWidth: unknown, fallbackHeight: unknown) {

        return {
            width: getImageDimension(resourceWidth, fallbackWidth),
            height: getImageDimension(resourceHeight, fallbackHeight)
        };
    }


    function getImageDimension(resourceDimension: unknown, fallbackDimension: unknown): number {

        const parsedResourceDimension = parseFloat(resourceDimension as any);
        const parsedFallbackDimension = parseFloat(fallbackDimension as any);

        if (Number.isFinite(parsedResourceDimension) && parsedResourceDimension > 0) return parsedResourceDimension;
        if (Number.isFinite(parsedFallbackDimension) && parsedFallbackDimension > 0) return parsedFallbackDimension;

        return 0;
    }
}
