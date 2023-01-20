const sharp = typeof window !== 'undefined' ? window.require('sharp') : require('sharp');

const MAX_INPUT_PIXELS = 2500000000;


/**
 * @author Thomas Kleinke
 */
export module ImageManipulation {

    export async function getSize(buffer: Buffer): Promise<{ width: number, height: number }> {

        const metadata = await getImage(buffer).metadata();
        return { width: metadata.width, height: metadata.height };
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

    
    export async function createDisplayImage(buffer: Buffer): Promise<Buffer> {

        const image = await getImage(buffer);
        const metadata = await image.metadata();

        return metadata.format === 'tiff'
            ? image.png().toBuffer()
            : buffer;
    }


    function getImage(buffer: Buffer): any {

        return sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS });
    }
}
