import {Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {Datastore} from 'idai-components-2/datastore';
import {IdaiFieldImageDocument} from '../../model/idai-field-image-document';
import {ImageGridComponent} from '../../imagegrid/image-grid.component';

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

    @ViewChild('imageGrid') public imageGrid: ImageGridComponent;
    public documents: IdaiFieldImageDocument[];

    @Input() imageIds: string[];

    @Output() onRelationTargetClicked: EventEmitter<Document> = new EventEmitter<Document>();

    constructor(
        private datastore: Datastore,
        private el: ElementRef
    ) {}

    public onResize() {

        if (!this.documents || this.documents.length == 0) return;

        this.imageGrid._onResize(this.el.nativeElement.children[0].clientWidth);
    }

    public clickRelation(document: Document) {

        this.onRelationTargetClicked.emit(document);
    }

    ngOnChanges() {

        if (!this.imageIds) return;

        this.documents = [];
        let promise = Promise.resolve();
        for (let id of this.imageIds) {
            promise = promise.then(() => this.datastore.get(id))
                .then(doc => {
                    this.documents.push(doc as IdaiFieldImageDocument);
                });
        }

        promise.then(() => this.imageGrid.calcGrid(this.el.nativeElement.children[0].clientWidth));
    }
}