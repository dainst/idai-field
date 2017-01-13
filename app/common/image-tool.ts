import {Datastore, Mediastore} from "idai-components-2/datastore";
import {M} from "../m";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {IdaiFieldImageDocument} from "../model/idai-field-image-document";

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

    public updateImageLinks(imageDocs: IdaiFieldImageDocument[], targetDoc: IdaiFieldDocument): Promise<any> {
        var promises = [];
        imageDocs.forEach( (imageDoc:IdaiFieldImageDocument) => {
            if (imageDoc.resource.depicts) promises.push(this.removeExistingReference(imageDoc));
            imageDoc.resource.depicts = targetDoc.id;
        });
        if (!targetDoc.resource.images) targetDoc.resource.images = [];
        targetDoc.resource.images = this.makeUnique(targetDoc.resource.images.concat(imageDocs.map(imageDoc => imageDoc.resource.identifier)));
        promises.concat(imageDocs.map(document => this.datastore.update(document)));
        promises.push(this.datastore.update(targetDoc));
        return Promise.all(promises);
    }

    private removeExistingReference(imageDoc) {
        return this.datastore.get(imageDoc.resource.depicts).then( (oldTargetDoc: IdaiFieldDocument) => {
            oldTargetDoc.resource.images.splice(oldTargetDoc.resource.images.indexOf(imageDoc.resource.identifier), 1);
            return this.datastore.update(oldTargetDoc);
        });
    }

    private makeUnique(a) {
        var n = {}, r = [];
        for(var i = 0; i < a.length; i++) {
            if (!n[a[i]]) {
                n[a[i]] = true;
                r.push(a[i]);
            }
        }
        return r;
    }

}