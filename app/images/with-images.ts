import {Messages} from "idai-components-2/messages";
import {M} from "../m";
import {Mediastore} from "../datastore/mediastore";
import {DomSanitizer} from "@angular/platform-browser";


export class WithImages {
    
    constructor(
        protected mediastore: Mediastore,
        protected sanitizer: DomSanitizer,
        protected messages: Messages
    ) { }

    protected urlForImage(filename): Promise<string> {
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
}