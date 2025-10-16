import { ImageManipulation } from '../image-manipulation';

const sharp = window.require('sharp');


/**
 * @author Thomas Kleinke
 */
export module SharpImageManipulation {

    /**
     * Create a sharp image instance based on raw buffer data.
     * 
     * See also https://sharp.pixelplumbing.com.
     * 
     * @param buffer, the raw image data.
     * @returns A sharp instance or Error for invalid buffer parameters (for example 
     * if the absolute number of pixels exceeds Field Desktop's maximum)
     */
    export function getImageObject(buffer: Buffer): any {

        return sharp(
            buffer,
            {
                limitInputPixels: ImageManipulation.MAX_INPUT_PIXELS,
                failOn: 'error' // Prevent sharp from failing on warnings for GeoTIFF tags
            }
        );
    }


    export async function createThumbnail(buffer: Buffer, targetHeight: number,
                                          targetJpegQuality: number): Promise<Buffer> {

        try {
            const sharpImage = getImageObject(buffer);
            const resizedImage = sharpImage.resize(undefined, targetHeight);
            const jpegImage = resizedImage.jpeg({ quality: targetJpegQuality });
            const result = await jpegImage.toBuffer();
            return result;
        } catch (err) {
            console.error('Failed to generate thumbnail:', err);
            return undefined;
        }
    }


    export async function isOpaque(image: any): Promise<boolean> {

        const stats = await image.stats();
        return stats.isOpaque;
    }

    
    export async function createDisplayImage(image: any, convertToJpeg: boolean, resize: boolean): Promise<Buffer> {

        if (convertToJpeg) image = image.jpeg();

        if (resize) {
            image = image.resize(
                ImageManipulation.MAX_DISPLAY_WIDTH,
                ImageManipulation.MAX_DISPLAY_HEIGHT,
                { fit: 'inside' }
            );
        }
        
        return image.toBuffer();
    }
}
