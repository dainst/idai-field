import { Injectable } from '@angular/core';

import { ThumbnailGeneratorInterface } from 'idai-field-core';
import { THUMBNAIL_TARGET_HEIGHT } from 'idai-field-core/src/datastore/image/image-store';

const nativeImage = typeof window !== 'undefined'
    ? window.require('electron').nativeImage : require('electron').nativeImage;
const Jimp = typeof window !== 'undefined' ? window.require('jimp') : require('jimp');
const ExifImage = typeof window !== 'undefined' ? window.require('exif').ExifImage : require('exif').ExifImage;

const THUMBNAIL_TARGET_JPEG_QUALITY = 60;

@Injectable()
/**
 * @author F.Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Simon Hohl
 *
 * The Electron nativeImage module is used per default. If the conversion process fails (which may happen
 * e. g. for CMYK images), Jimp is used. As Jimp is slower than nativeImage in most cases, it is only
 * used as a fallback in case the nativeImage conversion doesn't work.
 */
export class ThumbnailGenerator implements ThumbnailGeneratorInterface {


    public async generate(buffer: Buffer): Promise<Buffer> {

        const image = await this.isRotatedJpeg(buffer) ? undefined : this.convertWithElectron(buffer, THUMBNAIL_TARGET_HEIGHT);
        if (image && !image.isEmpty()) {
            return image.toJPEG(THUMBNAIL_TARGET_JPEG_QUALITY);
        } else {
            try {
                return await this.convertWithJimp(buffer, THUMBNAIL_TARGET_HEIGHT);
            } catch (err) {
                console.error('Failed to convert image using jimp:', err);
                return undefined;
            }
        }
    }


    private async isRotatedJpeg(buffer: Buffer): Promise<boolean> {

        return new Promise(resolve => {
            try {
                return new ExifImage(
                    { image : buffer },
                    (error: any, exifData: any) => {
                        if (error) return resolve(false);
                        return resolve(exifData?.image?.Orientation > 1);
                    }
                );
            } catch (error) {
                return resolve(false);
            }
        });
    }


    private convertWithElectron(buffer: Buffer, targetHeight: number) {

        return nativeImage.createFromBuffer(buffer)
            .resize({ height: targetHeight });
    }


    private async convertWithJimp(buffer: Buffer, targetHeight: number) {

        const image = await Jimp.read(buffer);

        return image.resize(Jimp.AUTO, targetHeight)
            .quality(THUMBNAIL_TARGET_JPEG_QUALITY)
            .getBufferAsync(Jimp.MIME_JPEG);
    }
}
