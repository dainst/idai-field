import {Component, OnChanges, Input} from '@angular/core';
import {Router} from '@angular/router';
import {Document} from 'idai-components-2/core';
import {Datastore} from 'idai-components-2/datastore';
import {Messages} from 'idai-components-2/messages';
import {Imagestore} from '../imagestore/imagestore';
import {BlobMaker} from '../imagestore/blob-maker';
import {ImageContainer} from '../imagestore/image-container';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';

@Component({
    selector: 'thumbnail-view',
    moduleId: module.id,
    templateUrl: './thumbnail-view.html'
})

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ThumbnailViewComponent implements OnChanges {

    @Input() imageIds: string[];

    public images = [];

    constructor(
        private imagestore: Imagestore,
        private datastore: Datastore,
        private router: Router,
        private messages: Messages
    ) {}

    public selectImage(documentToJumpTo: Document) {

        this.router.navigate(['images', documentToJumpTo.resource.id, 'show', 'relations']);
    }

    ngOnChanges() {

        if (!this.imageIds) return;

        this.images = [];

        for (let id of this.imageIds) {
            let imageContainer: ImageContainer;

            this.datastore.get(id)
                .then(doc => {
                    imageContainer = { document: <IdaiFieldImageDocument> doc };
                    return this.imagestore.read(imageContainer.document.resource.id);
                }).then(url => {
                    if (!this.isLoaded(id)) {
                        imageContainer.imgSrc = url;
                        this.images.push(imageContainer);
                    }
                }).catch(msgWithParams => {
                    if (!this.isLoaded(id)) {
                        imageContainer.imgSrc = BlobMaker.blackImg;
                        this.images.push(imageContainer);
                        this.messages.add(msgWithParams);
                    }
                });
        }
    }

    private isLoaded(resourceId: string): boolean {

        for (let imageContainer of this.images) {
            if (imageContainer.document.resource.id == resourceId) return true;
        }

        return false;
    }
}