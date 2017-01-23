import {Component, OnChanges, Input} from "@angular/core";
import {Mediastore, Datastore} from "idai-components-2/datastore";
import {Messages} from "idai-components-2/messages";
import {BlobProxy} from "../common/blob-proxy";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {DomSanitizer} from "@angular/platform-browser";


@Component({
    selector: 'thumbnail-view',
    moduleId: module.id,
    templateUrl: './thumbnail-view.html'
})

/**
 * @author Sebastian Cuy
 */
export class ThumbnailViewComponent implements OnChanges {

    private blobProxy : BlobProxy;


    @Input() document: IdaiFieldDocument;

    // TODO create an event emitter for error handling - loading fails

    public images = [];

    constructor(
        mediastore: Mediastore,
        sanitizer: DomSanitizer,
        private datastore: Datastore,
        private messages: Messages
    ) {
        this.blobProxy = new BlobProxy(mediastore,sanitizer);
    }

    ngOnChanges() {
        this.images = [];

        if(this.document.resource.relations["depictedIn"]) {
            this.document.resource.relations["depictedIn"].forEach(id =>
                this.datastore.get(id)
                    .then(doc => this.blobProxy.urlForImage(doc.resource["identifier"]),
                        err => this.messages.addWithParams(err))
                    .then(imageUrl => this.images.push(imageUrl),
                        err => this.messages.addWithParams(err))
            );
        } else {
            if (this.document.resource.type == "image") {
                this.blobProxy.urlForImage(this.document.resource["identifier"])
                    .then(imageUrl => this.images.push(imageUrl),
                        err => this.messages.addWithParams(err))
            }
        }

    }
}