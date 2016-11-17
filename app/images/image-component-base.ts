import {ActivatedRoute, Params} from "@angular/router";
import {ReadDatastore} from "idai-components-2/datastore";
import {Messages} from "idai-components-2/messages";
import {Mediastore} from "../datastore/mediastore";
import {DomSanitizer} from "@angular/platform-browser";
import {ImageTool, ImageContainer} from "./image-tool";

/**
 * @author Daniel de Oliveira
 */
export class ImageComponentBase {

    protected image : ImageContainer = {};
    private imageTool : ImageTool;

    constructor(
        private route: ActivatedRoute,
        private datastore: ReadDatastore,
        mediastore: Mediastore,
        sanitizer: DomSanitizer,
        messages: Messages
    ) {
        this.imageTool = new ImageTool(mediastore,sanitizer,messages);
    }

    protected fetchDocAndImage() {
        this.getRouteParams(function(id){
            this.id=id;
            this.datastore.get(id).then(
                doc=>{
                    // this.doc = doc;
                    this.image.document = doc;
                    if (doc.resource.filename) this.imageTool.setImgSrc(this.image);
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