import { Jimp } from 'jimp';
import { ImageManipulation } from '../image-manipulation';


/**
 * @author Thomas Kleinke
 */
export module JimpImageManipulation {

    export function getImageObject(buffer: Buffer): Promise<any> {

        return Jimp.fromBuffer(buffer);
    }


    export async function createThumbnail(buffer: Buffer, targetHeight: number,
                                          targetJpegQuality: number): Promise<Buffer> {

        try {
            const image = await getImageObject(buffer);
            return image.resize({ h: targetHeight })
                .getBuffer('image/jpeg', { quality: targetJpegQuality });
        } catch (err) {
            console.error('Failed to generate thumbnail:', err);
            return undefined;
        }
    }


    export function isOpaque(image: any): boolean {

        return image.hasAlpha();
    }

    
    export async function createDisplayImage(image: any, convertToJpeg: boolean, resize: boolean): Promise<Buffer> {

        if (resize) {
            image = image.scaleToFit({
                w: ImageManipulation.MAX_DISPLAY_WIDTH,
                h: ImageManipulation.MAX_DISPLAY_HEIGHT
            });
        }

        const mimeType: string = convertToJpeg || !image.mime
            ? 'image/jpeg'
            : image.mime;
        
        return image.getBuffer(mimeType);
    }
}
