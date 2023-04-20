import { Injectable } from '@angular/core';
import { ThumbnailGeneratorInterface } from 'idai-field-core';


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

        return buffer;
    }
}
