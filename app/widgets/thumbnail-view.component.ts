import {Component, OnChanges, Input} from "@angular/core";
import {Mediastore, Datastore} from "idai-components-2/datastore";
import {BlobProxy} from "../common/blob-proxy";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {DomSanitizer} from "@angular/platform-browser";
import {forEach} from "@angular/router/src/utils/collection";
import {Data} from "@angular/router";


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

    // TODO create an event emitter for error handling

    public images = [];

    constructor(
        mediastore: Mediastore,
        sanitizer: DomSanitizer,
        private datastore: Datastore
    ) {
        this.blobProxy = new BlobProxy(mediastore,sanitizer);
    }

    ngOnChanges() {
        if (!this.document || !this.document.resource.images) {
            this.images = []
        } else {
            Promise.all(this.document.resource.images.map(identifier =>

                // TODO handle error
                this.blobProxy.urlForImage(identifier)))
                .then(images => this.images = images);
        }


        if(this.document.resource.relations["depictedIn"]) {
            this.document.resource.relations["depictedIn"].forEach(id =>
                this.datastore.get(id)
                .then(doc => this.blobProxy.urlForImage(doc.resource["identifier"])).then(imageUrl => this.images.push(imageUrl))
            )
        }

    }
}