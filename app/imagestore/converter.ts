import {nativeImage} from 'electron';
// suppress compile errors TODO remove when typings are there
interface NI { createFromBuffer(key:any):any; }

/**
 * @author F.Z.
 * @author Daniel de Oliveira
 */
export class Converter {

    public convert(data) {
        let img = (nativeImage as NI) // TODO see TODO at top of the page
            .createFromBuffer(Buffer.from(data));
        img = img.resize({height: 320});
        return img.toJPEG(60);
    }
}