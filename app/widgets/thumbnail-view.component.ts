import {Component, OnChanges, Input} from "@angular/core";
import {Mediastore, Datastore} from "idai-components-2/datastore";
import {BlobProxy, ImageContainer} from "../common/blob-proxy";
import {IdaiFieldDocument} from "../model/idai-field-document";
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

    @Input() document: IdaiFieldDocument;
    // TODO create an event emitter for error handling - loading fails

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
        if(!this.document.resource.relations["depictedIn"]) return;

        this.images = [];
        this.document.resource.relations["depictedIn"].forEach(id =>
            this.datastore.get(id)
                .then(doc => {
                    var imgContainer : ImageContainer = {
                        document: <IdaiFieldImageDocument> doc
                    };
                    this.blobProxy.setImgSrc(imgContainer).then(()=>{
                        this.images.push(imgContainer);
                    }).catch(errs=>{
                        for (var err of errs) this.messages.add(err);
                    });
                })
        );
    }
}