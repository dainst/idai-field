import {Injectable} from '@angular/core';
// import {nativeImage} from 'electron';


@Injectable()
/**
 * @author F.Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ImageConverter {

    public convert(data: any): Buffer|undefined {

      // TODO
        // let img = nativeImage.createFromBuffer(Buffer.from(data));
        // img = img.resize({ height: 320 });
        //
        // return img.isEmpty() ? undefined : img.toJPEG(60);
      return undefined;
    }
}
