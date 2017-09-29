import {Component, ElementRef, Input} from '@angular/core';
import {ImageGridBuilder} from '../common/image-grid-builder';
import {Imagestore} from '../imagestore/imagestore';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Messages} from 'idai-components-2/messages';
import {IdaiFieldDatastore} from '../datastore/idai-field-datastore';
import {ImagePickerComponent} from '../widgets/image-picker.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {ImageGridComponentBase} from "../common/image-grid-component-base";

@Component({
    selector: 'docedit-image-tab',
    moduleId: module.id,
    templateUrl: './docedit-image-tab.html'
})

/**
 * @author F.Z.
 * @author Daniel de Oliveira
 */
export class DoceditImageTabComponent extends ImageGridComponentBase {

    @Input() document: IdaiFieldDocument;

    private static NR_OF_COLUMNS: number = 3;

    constructor(
        private imagestore: Imagestore,
        private el: ElementRef,
        messages: Messages,
        private datastore: IdaiFieldDatastore,
        private modalService: NgbModal,
        private documentEditChangeMonitor: DocumentEditChangeMonitor
    ) {
        super(
            new ImageGridBuilder(imagestore, true),
            messages,
            DoceditImageTabComponent.NR_OF_COLUMNS
        );
    }

    ngOnChanges() {

        if (!this.document) return;
        if (this.document.resource.relations['isDepictedIn']) {
            this.loadImages();
        }
    }

    private loadImages() {

        const imageDocPromises = [];
        this.documents = [];
        this.document.resource.relations['isDepictedIn'].forEach(id => {
            imageDocPromises.push(this.datastore.get(id));
        });

        Promise.all(imageDocPromises).then(docs => {
            this.documents = docs as Array<IdaiFieldImageDocument>;
            this.calcGrid(this.el.nativeElement.children[0].clientWidth);
        });
    }

    private addIsDepictedInRelations(imageDocuments: IdaiFieldImageDocument[]) {

        const relations = this.document.resource.relations['isDepictedIn']
            ? this.document.resource.relations['isDepictedIn'].slice() : [];

        for (let i in imageDocuments) {
            if (relations.indexOf(imageDocuments[i].resource.id) == -1) {
                relations.push(imageDocuments[i].resource.id);
            }
        }

        this.document.resource.relations['isDepictedIn'] = relations;

        this.loadImages();
    }

    public onResize() {

        if (!this.documents || this.documents.length == 0) return; // TODO code duplicated - move it to _onResize

        this._onResize(this.el.nativeElement.children[0].clientWidth);
    }

    public openImagePicker() {

        let imagePickerModal = this.modalService.open(ImagePickerComponent, { size: 'lg' });
        imagePickerModal.componentInstance.setDocument(this.document);

        imagePickerModal.result.then(
            (selectedImages: Array<IdaiFieldImageDocument>) => {
                this.addIsDepictedInRelations(selectedImages);
                this.documentEditChangeMonitor.setChanged();
            }
        ).catch(() => {
            // Cancel
        });
    }
}