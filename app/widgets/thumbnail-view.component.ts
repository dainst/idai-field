import {Component, OnChanges, Input, ElementRef, Output, EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
import {Document} from 'idai-components-2/core';
import {Datastore} from 'idai-components-2/datastore';
import {Imagestore} from '../imagestore/imagestore';
import {BlobMaker} from '../imagestore/blob-maker';
import {ImageContainer} from '../imagestore/image-container';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {ImageGridComponentBase} from "../common/image-grid-component-base";
import {ImageGridBuilder} from "../common/image-grid-builder";
import {Messages} from 'idai-components-2/messages';

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
export class ThumbnailViewComponent extends ImageGridComponentBase implements OnChanges {

    @Input() imageIds: string[];

    private static NR_OF_COLUMNS: number = 1;

    @Output() onRelationTargetClicked: EventEmitter<Document> = new EventEmitter<Document>();

    constructor(
        private imagestore: Imagestore,
        private datastore: Datastore,
        messages: Messages,
        private router: Router,
        private el: ElementRef
    ) {
        super(
            new ImageGridBuilder(imagestore, true),
            messages,
            ThumbnailViewComponent.NR_OF_COLUMNS
        );
    }

    public selectImage(documentToJumpTo: Document) {

        this.router.navigate(['images', documentToJumpTo.resource.id, 'show', 'relations']);
    }

    public onResize() {

        if (!this.documents || this.documents.length == 0) return;

        this._onResize(this.el.nativeElement.children[0].clientWidth);
    }

    public clickRelation(document: Document) {

        this.onRelationTargetClicked.emit(document);
    }

    ngOnChanges() {

        if (!this.imageIds) return;

        this.documents = [];
        let promise = Promise.resolve();
        for (let id of this.imageIds) {
            promise = promise.then(() => this.datastore.get(id)
                .then(doc => {
                    this.documents.push(doc as IdaiFieldImageDocument);
                }))
        }

        promise.then(() => this.calcGrid(this.el.nativeElement.children[0].clientWidth));
    }
}