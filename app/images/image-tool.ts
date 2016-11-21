import {Messages} from "idai-components-2/messages";
import {Datastore} from "idai-components-2/datastore";
import {M} from "../m";
import {Mediastore} from "../datastore/mediastore";

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
     * @returns {Promise<T>}
     */
    public remove(document): Promise<any> {
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