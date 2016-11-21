import {Messages} from "idai-components-2/messages";
import {Datastore} from "idai-components-2/datastore";
import {M} from "../m";
import {Mediastore} from "../datastore/mediastore";

/**
 * @author Sebastian Cuy
 */
export class ImageTool {

    constructor(
        private datastore: Datastore,
        private mediastore: Mediastore,
        private messages: Messages
    ) { }
    
    public delete(document): Promise<any> {
        return new Promise((resolve) => {
            this.mediastore.remove(document.resource.identifier).then(() => {
                this.datastore.remove(document.id).then(() => resolve()).catch(err => {
                    this.messages.add(M.IMAGES_ERROR_DELETE, [document.resource.identifier]);
                    console.log(err);
                });
            }).catch(err => {
                this.messages.add(M.IMAGES_ERROR_DELETE, [document.resource.identifier]);
                console.log(err);
            });
        });
    }
}