import { Injectable } from '@angular/core';
import { ThumbnailGeneratorInterface, THUMBNAIL_TARGET_HEIGHT } from 'idai-field-core';
import { ImageManipulation } from './manipulation/image-manipulation';


const THUMBNAIL_TARGET_JPEG_QUALITY = 60;


@Injectable()
/**
 * @author F.Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Simon Hohl
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
