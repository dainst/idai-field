import {Injectable} from '@angular/core';

const nativeImage = typeof window !== 'undefined'
    ? window.require('electron').nativeImage
    : require('electron').nativeImage;
const Jimp = typeof window !== 'undefined' ? window.require('jimp') : require('jimp');


@Injectable()
/**
 * @author F.Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ImageConverter {

    public async convert(data: any): Promise<Buffer> {

        const buffer: Buffer = Buffer.from(data);

        const image = this.convertWithElectron(buffer);
        if (!image.isEmpty()) {
            return image.toJPEG(60);
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
            .resize({ height: 320 });
    }


    private async convertWithJimp(buffer: Buffer) {

        const image = await Jimp.read(buffer);

        return image.resize(Jimp.AUTO, 320)
            .quality(60)
            .getBufferAsync(Jimp.MIME_JPEG);
    }
}
