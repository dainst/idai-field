import {Component, EventEmitter, Input, OnChanges, Output, ViewChild} from '@angular/core';
import {Document, Messages} from 'idai-components-2';
import {IdaiFieldImageDocument} from 'idai-components-2';
import {ImageGridComponent} from '../../../imagegrid/image-grid.component';
import {IdaiFieldImageDocumentReadDatastore} from '../../../../core/datastore/field/idai-field-image-document-read-datastore';
import {ImageUploadResult} from '../../../imageupload/image-uploader';
import {M} from '../../../../m';

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

    @Input() document: Document;

    @Output() onRelationTargetClicked: EventEmitter<Document> = new EventEmitter<Document>();


    constructor(private datastore: IdaiFieldImageDocumentReadDatastore,
                private messages: Messages) {}


    ngOnChanges() {

        this.updateGrid();
    }


    public onResize() {

        if (!this.documents || this.documents.length == 0) return;

        this.imageGrid.calcGrid();
    }


    public async onImagesUploaded(uploadResult: ImageUploadResult) {

        this.updateGrid();
        this.showUploadResultMessage(uploadResult);
    }


    public clickRelation(document: Document) {

        this.onRelationTargetClicked.emit(document);
    }


    private updateGrid() {

        this.documents = [];

        if (!Document.hasRelations(this.document, 'isDepictedIn')) return;

        let promise = Promise.resolve();
        for (let id of this.document.resource.relations['isDepictedIn']) {
            promise = promise.then(() => this.datastore.get(id))
                .then(doc => {
                    this.documents.push(doc as any);
                });
        }

        promise.then(() => this.imageGrid.calcGrid());
    }
    
    
    private showUploadResultMessage(uploadResult: ImageUploadResult) {

        if (uploadResult.uploadedImages == 1) {
            this.messages.add([M.RESOURCES_SUCCESS_IMAGE_UPLOADED, this.document.resource.identifier]);
        } else if (uploadResult.uploadedImages > 1) {
            this.messages.add([M.RESOURCES_SUCCESS_IMAGES_UPLOADED, uploadResult.uploadedImages.toString(),
                this.document.resource.identifier]);
        }
    }
}