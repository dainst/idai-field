import {Component, OnChanges, Input} from "@angular/core";
import {Mediastore, Datastore} from "idai-components-2/datastore";
import {BlobProxy} from "../common/blob-proxy";
import {ImageContainer} from "../common/image-container";
import {DomSanitizer} from "@angular/platform-browser";
import {Router} from "@angular/router";
import {IdaiFieldImageDocument} from "../model/idai-field-image-document";
import {Messages} from "idai-components-2/messages";


@Component({
    selector: 'thumbnail-view',
    moduleId: module.id,
    templateUrl: './thumbnail-view.html'
})

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class ThumbnailViewComponent implements OnChanges {

    @Input() imageIds: string[];

    private blobProxy : BlobProxy;
    public images = [];

    constructor(
        mediastore: Mediastore,
        sanitizer: DomSanitizer,
        private datastore: Datastore,

        private router: Router,
        private messages: Messages
    ) {
        this.blobProxy = new BlobProxy(mediastore,sanitizer);
    }

    public selectImage(documentToJumpTo) {
        this.router.navigate(['images',documentToJumpTo.resource.id,'show'])
    }


    ngOnChanges() {
        if(!this.imageIds) return;

        this.images = [];
        this.imageIds.forEach(id =>
            this.datastore.get(id)
                .then(doc => {
                    var imgContainer: ImageContainer = {
                        document: <IdaiFieldImageDocument> doc
                    };
                    this.blobProxy.getBlobUrl(
                        imgContainer.document.resource.filename).
                        then(url=> {
                            imgContainer.imgSrc = url;
                            this.images.push(imgContainer);
                        }).catch(msgWithParams=>{
                            imgContainer.imgSrc = BlobProxy.blackImg;
                            this.images.push(imgContainer);
                            this.messages.addWithParams(msgWithParams)
                        });
                })
        );
    }
}