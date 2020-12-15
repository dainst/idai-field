import {Injectable} from '@angular/core';

const nativeImage = typeof window !== 'undefined'
    ? window.require('electron').nativeImage
    : require('electron').nativeImage;
const Jimp = typeof window !== 'undefined' ? window.require('jimp') : require('jimp');


const TARGET_HEIGHT = 320;
const TARGET_JPEG_QUALITY = 60;


@Injectable()
/**
 * @author F.Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 *
 * The Electron nativeImage module is used per default. If the conversion process fails (which may happen
 * e. g. for CMYK images), Jimp is used. As Jimp is slower than nativeImage in most cases, it is only
 * used as a fallback in case the nativeImage conversion doesn't work.
 */
export class ImageConverter {

    public async convert(data: any): Promise<Buffer> {

        const buffer: Buffer = Buffer.from(data);

        const image = this.convertWithElectron(buffer);
        if (!image.isEmpty()) {
            return image.toJPEG(TARGET_JPEG_QUALITY);
        } else {
            try {
                return await this.convertWithJimp(buffer);
            } catch (err) {
                console.error('Failed to convert image using jimp:', err);
                return undefined;
            }
        }
    }


    private convertWithElectron(buffer: Buffer) {

        return nativeImage.createFromBuffer(buffer)
            .resize({ height: TARGET_HEIGHT });
    }


    private async convertWithJimp(buffer: Buffer) {

        const image = await Jimp.read(buffer);

        return image.resize(Jimp.AUTO, TARGET_HEIGHT)
            .quality(TARGET_JPEG_QUALITY)
            .getBufferAsync(Jimp.MIME_JPEG);
    }
}
