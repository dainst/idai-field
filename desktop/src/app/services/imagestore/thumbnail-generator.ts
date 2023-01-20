import { Injectable } from '@angular/core';
import { ThumbnailGeneratorInterface, THUMBNAIL_TARGET_HEIGHT } from 'idai-field-core';
import { ImageManipulation } from './image-manipulation';


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

    public generate(buffer: Buffer): Promise<Buffer> {

        return ImageManipulation.createThumbnail(
            buffer,
            THUMBNAIL_TARGET_HEIGHT,
            THUMBNAIL_TARGET_JPEG_QUALITY
        );
    }
}
