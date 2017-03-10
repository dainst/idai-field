import {Datastore} from "idai-components-2/datastore";
import {Mediastore} from "../imagestore/mediastore";
import {M} from "../m";

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class ImageTool {

    constructor(
    ) { }

    /**
     * 
     * @param document
     * @return {Promise<Array<string>>} where the string array is a <code>msgWithParams</code> ({@link Messages#addWithParams}).
     */
    public remove(document, mediastore: Mediastore, datastore: Datastore): Promise<Array<string>> {
        return new Promise((resolve,reject) => {
            mediastore.remove(document.resource.identifier).then(() => {
                datastore.remove(document).then(() => resolve()).catch(err => {
                    reject([M.IMAGES_ERROR_DELETE, [document.resource.identifier]]);
                });
            }).catch(err => {
                reject([M.IMAGES_ERROR_DELETE, [document.resource.identifier]]);
            });
        });
    }

}