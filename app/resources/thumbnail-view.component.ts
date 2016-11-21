import {Component, OnChanges, Input} from "@angular/core";
import {Mediastore} from "idai-components-2/datastore";
import {BlobProxy} from "../common/blob-proxy";
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

    @Input() document: any;

    // TODO create an event emitter for error handling

    public images = [];

    constructor(
        mediastore: Mediastore,
        sanitizer: DomSanitizer
    ) {
        this.blobProxy = new BlobProxy(mediastore,sanitizer);
    }

    ngOnChanges() {
        if (!this.document || !this.document.resource.images) {
            this.images = []
        } else {
            Promise.all(this.document.resource.images.map(id =>

                // TODO handle error
                this.blobProxy.urlForImage(id)))
                .then(images => this.images = images);
        }
    }
}