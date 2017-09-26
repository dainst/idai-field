import {Injectable} from '@angular/core';
import {nativeImage} from 'electron';

interface NI { createFromBuffer(key: any): any; }

@Injectable()
/**
 * @author F.Z.
 * @author Daniel de Oliveira
 */
export class Converter {

    public convert(data) {
        let img = (nativeImage as NI).createFromBuffer(Buffer.from(data));
        img = img.resize({height: 320});
        return img.toJPEG(60);
    }
}