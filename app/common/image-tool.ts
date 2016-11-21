import {Messages} from "idai-components-2/messages";
import {Datastore} from "idai-components-2/datastore";
import {M} from "../m";
import {Mediastore} from "idai-components-2/datastore";

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class ImageTool {

    constructor(
        private datastore: Datastore,
        private mediastore: Mediastore
    ) { }

    /**
     * 
     * @param document
     * @return {Promise<Array<string>>} where the string array is a <code>msgWithParams</code> ({@link Messages#addWithParams}).
     */
    public remove(document): Promise<Array<string>> {
        return new Promise((resolve,reject) => {
            this.mediastore.remove(document.resource.identifier).then(() => {
                this.datastore.remove(document.id).then(() => resolve()).catch(err => {
                    reject([M.IMAGES_ERROR_DELETE, [document.resource.identifier]]);
                });
            }).catch(err => {
                reject([M.IMAGES_ERROR_DELETE, [document.resource.identifier]]);
            });
        });
    }
}