const sharp = typeof window !== 'undefined' ? window.require('sharp') : require('sharp');

const MAX_INPUT_PIXELS = 2500000000;
const MAX_ORIGINAL_PIXELS = 25000000;
const MAX_DISPLAY_WIDTH = 10000;
const MAX_DISPLAY_HEIGHT = 10000;


export module ImageManipulationErrors {

    export const MAX_INPUT_PIXELS_EXCEEDED = 'imageManipulation/maxInputPixelsExceeded';
}


/**
 * @author Thomas Kleinke
 */
export module ImageManipulation {

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


    export function needsDisplayVersion(width: number, height: number, fileExtension: string): boolean {

        return shouldConvertToJpeg(width, height, fileExtension)
            || shouldResize(width, height);
    }

    
    export async function createDisplayImage(buffer: Buffer, width: number, height: number,
                                             fileExtension: string): Promise<Buffer> {

        let image = getImage(buffer);

        if (shouldConvertToJpeg(width, height, fileExtension)) {
            image = image.jpeg();
        }
        if (shouldResize(width, height)) {
            image = image.resize(MAX_DISPLAY_WIDTH, MAX_DISPLAY_HEIGHT, { fit: 'inside' });
        }
        
        return image.toBuffer();
    }


    function shouldConvertToJpeg(width: number, height: number, fileExtension: string) {

        return fileExtension.toLowerCase().includes('tif')
            || (!['jpg', 'jpeg'].includes(fileExtension) && width * height > MAX_ORIGINAL_PIXELS);
    }


    function shouldResize(width: number, height: number) {

        return width > MAX_DISPLAY_WIDTH
            || height > MAX_DISPLAY_HEIGHT;
    }


    function getImage(buffer: Buffer): any {

        return sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS });
    }
}
