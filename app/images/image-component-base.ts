import {ActivatedRoute, Params} from "@angular/router";
import {Datastore} from "idai-components-2/datastore";
import {Messages} from "idai-components-2/messages";
import {Mediastore} from "idai-components-2/datastore";
import {DomSanitizer} from "@angular/platform-browser";
import {BlobProxy} from "../common/blob-proxy";
import {ImageContainer} from "../common/image-container";
import {IdaiFieldImageDocument} from "../model/idai-field-image-document";

/**
 * @author Daniel de Oliveira
 */
export class ImageComponentBase {

    protected image : ImageContainer = {};
    private blobProxy : BlobProxy;

    constructor(
        private route: ActivatedRoute,
        protected datastore: Datastore,
        mediastore: Mediastore,
        sanitizer: DomSanitizer,
        protected messages: Messages
    ) {
        this.blobProxy = new BlobProxy(mediastore,sanitizer);
    }

    protected fetchDocAndImage() {
        let id;
        this.route.params.forEach((params: Params) => {
            this._fetchDocAndImage((id=params['id']));
        }).catch(()=>{
            console.error("Fatal error: could not load document for id ",id);
        });
    }

    private _fetchDocAndImage(id) {
        this.datastore.get(id).then(
            doc=>{
                this.image.document = doc as IdaiFieldImageDocument;
                if (this.image.document.resource.filename) {
                    this.blobProxy.getBlobUrl(this.image.document.resource.filename).then(url=>{
                        this.image.imgSrc = url;
                    }).catch(err=>{
                        this.image.imgSrc = BlobProxy.blackImg;
                        this.messages.addWithParams(err);
                    });
                }
            });
    }
}