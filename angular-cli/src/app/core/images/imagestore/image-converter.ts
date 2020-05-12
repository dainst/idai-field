import {Injectable} from '@angular/core';
const nativeImage = window.require('electron').nativeImage;


@Injectable()
/**
 * @author F.Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ImageConverter {

    public convert(data: any): Buffer|undefined {

        let img = nativeImage.createFromBuffer(Buffer.from(data));
        img = img.resize({ height: 320 });

        return img.isEmpty() ? undefined : img.toJPEG(60);
    }
}
