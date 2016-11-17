import {Messages} from "idai-components-2/messages";
import {M} from "../m";
import {Mediastore} from "../datastore/mediastore";
import {DomSanitizer} from "@angular/platform-browser";

/**
 * @author Sebastian Cuy
 * @autor Daniel de Oliveira
 */
export class WithImages {
    
    constructor(
        protected mediastore: Mediastore,
        protected sanitizer: DomSanitizer,
        protected messages: Messages
    ) { }

    private urlForImage(filename): Promise<string> {
        return new Promise((resolve, reject) => {
            this.mediastore.read(filename).then(data => {
                var url = URL.createObjectURL(new Blob([data]));
                resolve(this.sanitizer.bypassSecurityTrustResourceUrl(url));
            }).catch(error => {
                this.messages.add(M.IMAGES_ERROR_MEDIASTORE_READ, [filename]);
                console.error(error);
                reject(error);
            });
        });
    }

    protected setImgSrc(imgCell,filename) {
        var image = imgCell;

        var callback = image => { return url => image['imgSrc'] = url };
        var errorCallback = image => { return url =>
            // display a black image
            image['imgSrc'] = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
        };
        this.urlForImage(filename)
            .then(callback(image))
            .catch(errorCallback(image));
    }
}