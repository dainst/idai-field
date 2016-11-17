import {ActivatedRoute, Params} from "@angular/router";
import {ReadDatastore} from "idai-components-2/datastore";
import {Messages} from "idai-components-2/messages";
import {Document} from "idai-components-2/core";
import {Mediastore} from "../datastore/mediastore";
import {DomSanitizer} from "@angular/platform-browser";
import {WithImages} from "./with-images";

/**
 * @author Daniel de Oliveira
 */
export class ImageBase extends WithImages {

    protected image = {};
    protected doc : Document;

    constructor(
        private route: ActivatedRoute,
        private datastore: ReadDatastore,
        mediastore: Mediastore,
        sanitizer: DomSanitizer,
        messages: Messages
    ) {
        super(mediastore,sanitizer,messages);
    }

    protected fetchDocAndImage() {
        this.getRouteParams(function(id){
            this.id=id;
            this.datastore.get(id).then(
                doc=>{
                    this.doc = doc;
                    if (doc.resource.filename) this.setImgSrc(this.image,doc.resource.filename);
                },
                err=>{
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