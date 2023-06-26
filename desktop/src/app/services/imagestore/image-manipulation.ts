const sharp = typeof window !== 'undefined' ? window.require('sharp') : require('sharp');

import ExifReader from 'exifreader';

export module ImageManipulationErrors {

    export const MAX_INPUT_PIXELS_EXCEEDED = 'imageManipulation/maxInputPixelsExceeded';
}


/**
 * @author Thomas Kleinke
 */
export module ImageManipulation {

    export const MAX_INPUT_PIXELS = 2500000000;
    export const MAX_ORIGINAL_PIXELS = 25000000;
    export const MAX_DISPLAY_WIDTH = 10000;
    export const MAX_DISPLAY_HEIGHT = 10000;


    /**
     * Create a sharp image instance based on raw buffer data.
     * 
     * See also https://sharp.pixelplumbing.com.
     * 
     * @param buffer, the raw image data.
     * @returns A sharp instance or Error for invalid buffer parameters (for example 
     * if the absolute number of pixels exceeds Field Desktop's maximum)
     */
    export function getSharpImage(buffer: Buffer): any {

        return sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS });
    }


    export async function createThumbnail(buffer: Buffer, targetHeight: number,
                                          targetJpegQuality: number): Promise<Buffer> {

        try {
            return await getSharpImage(buffer)
                .resize(undefined, targetHeight)
                .jpeg({ quality: targetJpegQuality })
                .toBuffer();
        } catch (err) {
            console.error('Failed to generate thumbnail:', err);
            return undefined;
        }
    }


    export async function isOpaque(image: any): Promise<boolean> {

        const stats = await image.stats();
        return stats.isOpaque;
    }

    
    export async function createDisplayImage(image: any, convertToJpeg: boolean,
                                             resize: boolean): Promise<Buffer> {

        if (convertToJpeg) image = image.jpeg();
        if (resize) image = image.resize(MAX_DISPLAY_WIDTH, MAX_DISPLAY_HEIGHT, { fit: 'inside' });
        
        return image.toBuffer();
    }
}
