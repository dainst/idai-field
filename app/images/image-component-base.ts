import {ActivatedRoute, Params} from "@angular/router";
import {Datastore} from "idai-components-2/datastore";
import {Messages} from "idai-components-2/messages";
import {Imagestore} from "../imagestore/imagestore";
import {DomSanitizer} from "@angular/platform-browser";
import {BlobProxy} from "../imagestore/blob-proxy";
import {ImageContainer} from "../imagestore/image-container";

/**
 * @author Daniel de Oliveira
 */
export class ImageComponentBase {

    protected image : ImageContainer = {};
    private blobProxy : BlobProxy;

    constructor(
        private route: ActivatedRoute,
        protected datastore: Datastore,
        imagestore: Imagestore,
        sanitizer: DomSanitizer,
        protected messages: Messages
    ) {
        this.blobProxy = new BlobProxy(imagestore,sanitizer);
    }

    protected fetchDocAndImage() {
        this.getRouteParams(function(id){
            this.id=id;
            this.datastore.get(id).then(
                doc=>{
                    this.image.document = doc;
                    if (doc.resource.filename) {
                        this.blobProxy.getBlobUrl(doc.resource.filename).then(url=>{
                            this.image.imgSrc = url;
                        }).catch(msgWithParams=>{
                            this.image.imgSrc = BlobProxy.blackImg;
                            this.messages.add(msgWithParams);
                        });
                    }
                },
                ()=>{
                    console.error("Fatal error: could not load document for id ",id);
                });
        }.bind(this));
    }

    private getRouteParams(callback) {
        this.route.params.forEach((params: Params) => {
            callback(params['id']);
        });
    }
}