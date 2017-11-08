import {Component, Input, ViewChild} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {IdaiFieldImageDocument} from '../../../core/model/idai-field-image-document';
import {ImagePickerComponent} from './image-picker.component';
import {ImageGridComponent} from '../../imagegrid/image-grid.component';
import {IdaiFieldImageDocumentReadDatastore} from "../../../core/datastore/idai-field-image-document-read-datastore";

@Component({
    selector: 'docedit-image-tab',
    moduleId: module.id,
    templateUrl: './docedit-image-tab.html'
})
/**
 * @author F.Z.
 * @author Daniel de Oliveira
 */
export class DoceditImageTabComponent {

    @ViewChild('imageGrid') public imageGrid: ImageGridComponent;
    public documents: IdaiFieldImageDocument[];

    public selected: IdaiFieldImageDocument[] = [];

    @Input() document: IdaiFieldDocument;


    constructor(
        private datastore: IdaiFieldImageDocumentReadDatastore,
        private modalService: NgbModal,
        private documentEditChangeMonitor: DocumentEditChangeMonitor
    ) {
    }


    ngOnChanges() {

        if (!this.document) return;
        if (this.document.resource.relations['isDepictedIn']) {
            this.loadImages();
        }
    }


    /**
     * @param document the object that should be selected
     */
    public select(document: IdaiFieldImageDocument) {

        if (this.selected.indexOf(document) == -1) this.selected.push(document);
        else this.selected.splice(this.selected.indexOf(document), 1);
    }


    public clearSelection() {

        this.selected = [];
    }


    public removeLinks() {

        const isDepictedIn = this.document.resource.relations['isDepictedIn'];
        const targetsToRemove = [];

        for (let target of isDepictedIn) {
            for (let sel of this.selected) {
                if (sel.resource.id == target) targetsToRemove.push(target);
            }
        }

        for (let targetToRemove of targetsToRemove) {
            isDepictedIn.splice(isDepictedIn.indexOf(targetToRemove), 1);
        }

        if (targetsToRemove.length > 0) this.documentEditChangeMonitor.setChanged();

        if (isDepictedIn.length == 0) {
            this.document.resource.relations['isDepictedIn'] = [];
            this.documents = [];
            this.clearSelection();
        } else {
            this.loadImages();
        }
    }


    private loadImages() {

        const imageDocPromises: any[] = [];
        this.documents = [];
        this.document.resource.relations['isDepictedIn'].forEach(id => {
            imageDocPromises.push(this.datastore.get(id));
        });

        Promise.all(imageDocPromises as any).then(docs => {
            this.documents = docs as Array<IdaiFieldImageDocument>;
            this.clearSelection();
        });
    }


    private addIsDepictedInRelations(imageDocuments: IdaiFieldImageDocument[]) {

        const relations = this.document.resource.relations['isDepictedIn']
            ? this.document.resource.relations['isDepictedIn'].slice() : [];

        for (let i in imageDocuments) {
            if (relations.indexOf(imageDocuments[i].resource.id as any) == -1) {
                relations.push(imageDocuments[i].resource.id as any);
            }
        }

        this.document.resource.relations['isDepictedIn'] = relations;

        this.loadImages();
    }


    public onResize() {

        if (!this.documents || this.documents.length == 0) return; // TODO code duplicated - move it to _onResize

        this.imageGrid.calcGrid();
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