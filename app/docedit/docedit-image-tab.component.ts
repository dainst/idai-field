import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {IdaiFieldDatastore} from '../datastore/idai-field-datastore';
import {ImagePickerComponent} from './image-picker.component';
import {ImageGridComponent} from '../imagegrid/image-grid.component';

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
        private el: ElementRef,
        private datastore: IdaiFieldDatastore,
        private modalService: NgbModal,
        private documentEditChangeMonitor: DocumentEditChangeMonitor
    ) {
    }

    ngOnChanges() {

        this.imageGrid.setClientWidth(this.el.nativeElement.children[0].clientWidth);

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

        if (isDepictedIn.length == 0) delete this.document.resource.relations['isDepictedIn'];

        this.loadImages();
    }

    private loadImages() {

        const imageDocPromises = [];
        this.documents = [];
        this.document.resource.relations['isDepictedIn'].forEach(id => {
            imageDocPromises.push(this.datastore.get(id));
        });

        Promise.all(imageDocPromises).then(docs => {
            this.documents = docs as Array<IdaiFieldImageDocument>;
            this.clearSelection();
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

        this.imageGrid._onResize(this.el.nativeElement.children[0].clientWidth);
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