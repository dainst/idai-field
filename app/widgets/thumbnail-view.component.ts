import {Component, OnChanges, Input} from "@angular/core";
import {Imagestore} from "../imagestore/imagestore";
import {Datastore} from "idai-components-2/datastore";
import {BlobMaker} from "../imagestore/blob-maker";
import {ImageContainer} from "../imagestore/image-container";
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

    public images = [];

    constructor(
        private imagestore: Imagestore,
        private datastore: Datastore,
        private router: Router,
        private messages: Messages
    ) { }

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
                    this.imagestore.getBlobUrl(
                        imgContainer.document.resource.filename).
                        then(url=> {
                            imgContainer.imgSrc = url;
                            this.images.push(imgContainer);
                        }).catch(msgWithParams=>{
                            imgContainer.imgSrc = BlobMaker.blackImg;
                            this.images.push(imgContainer);
                            this.messages.add(msgWithParams)
                        });
                })
        );
    }
}