import {nativeImage} from 'electron';

export class Converter {

    public convert(data) {
        let img = nativeImage.createFromBuffer(Buffer.from(data));
        img = img.resize({height: 320});
        return img.toJPEG(60);
    }
}