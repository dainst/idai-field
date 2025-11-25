import { JimpImageManipulation } from './jimp/jimp-image-manipulation';
import { SharpImageManipulation } from './sharp/sharp-image-manipulation';

const remote = window.require('@electron/remote');
const imageProcessing: 'sharp'|'jimp' = remote?.getGlobal('imageProcessing') ?? 'sharp';


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


    export async function createThumbnail(buffer: Buffer, targetHeight: number,
                                          targetJpegQuality: number): Promise<Buffer> {

        return imageProcessing === 'sharp'
            ? SharpImageManipulation.createThumbnail(buffer, targetHeight, targetJpegQuality)
            : JimpImageManipulation.createThumbnail(buffer, targetHeight, targetJpegQuality);
    }
}
