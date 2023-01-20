const sharp = typeof window !== 'undefined' ? window.require('sharp') : require('sharp');


/**
 * @author Thomas Kleinke
 */
export module ImageManipulation {

    export async function getSize(buffer: Buffer): Promise<{ width: number, height: number }> {

        const image = await sharp(buffer);
        const metadata = await image.metadata();
        return { width: metadata.width, height: metadata.height };
    }
}
