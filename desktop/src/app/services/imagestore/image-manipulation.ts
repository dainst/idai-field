const nativeImage = window.require('electron').nativeImage;


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

        try {
            return nativeImage.createFromBuffer(buffer)
                .resize({ height: targetHeight })
                .toJPEG(targetJpegQuality);
        } catch (err) {
            console.error('Failed to generate thumbnail:', err);
            return undefined;
        }
    }
}
