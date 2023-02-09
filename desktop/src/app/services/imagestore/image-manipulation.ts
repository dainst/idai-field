const sharp = typeof window !== 'undefined' ? window.require('sharp') : require('sharp');


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


    export function getImage(buffer: Buffer): any {

        return sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS });
    }



    export async function getSize(buffer: Buffer): Promise<{ width: number, height: number }> {

        try {
            const metadata = await getImage(buffer).metadata();
            return { width: metadata.width, height: metadata.height };
        } catch (err) {
            if (err.toString().includes('Input image exceeds pixel limit')) {
                throw [ImageManipulationErrors.MAX_INPUT_PIXELS_EXCEEDED, MAX_INPUT_PIXELS];
            } else {
                throw err;
            }
        }
    }


    export async function createThumbnail(buffer: Buffer, targetHeight: number,
                                          targetJpegQuality: number): Promise<Buffer> {

        try {
            return await getImage(buffer)
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
