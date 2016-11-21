import {Component, OnChanges, Input} from "@angular/core";
import {Datastore} from 'idai-components-2/datastore';
import {Messages} from 'idai-components-2/messages';
import {Mediastore} from "idai-components-2/datastore";
import {BlobProxy} from "../images/blob-proxy";
import {DomSanitizer} from '@angular/platform-browser';


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
    
    public images = [];

    constructor(
        mediastore: Mediastore,
        sanitizer: DomSanitizer,
        messages: Messages
    ) {
        this.blobProxy = new BlobProxy(mediastore,sanitizer,messages);
    }

    ngOnChanges() {
        if (!this.document || !this.document.resource.images) {
            this.images = []
        } else {
            Promise.all(this.document.resource.images.map(id => this.blobProxy.urlForImage(id)))
                .then(images => this.images = images);
        }
    }
}