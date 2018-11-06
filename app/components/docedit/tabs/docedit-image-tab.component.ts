import {Component, Input, ViewChild} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {IdaiFieldDocument, IdaiFieldImageDocument} from 'idai-components-2';
import {ImagePickerComponent} from '../widgets/image-picker.component';
import {ImageGridComponent} from '../../imagegrid/image-grid.component';
import {IdaiFieldImageDocumentReadDatastore} from '../../../core/datastore/field/idai-field-image-document-read-datastore';
import {SortUtil} from '../../../core/util/sort-util';

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

    @Input() document: IdaiFieldDocument;

    public documents: Array<IdaiFieldImageDocument>;
    public selected: Array<IdaiFieldImageDocument> = [];


    constructor(private datastore: IdaiFieldImageDocumentReadDatastore,
                private modalService: NgbModal,
                private i18n: I18n) {}


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
        const targetsToRemove = [] as any;

        for (let target of isDepictedIn) {
            for (let sel of this.selected) {
                if (sel.resource.id == target) targetsToRemove.push(target as never);
            }
        }

        if (!targetsToRemove) return;

        for (let targetToRemove of targetsToRemove) {
            isDepictedIn.splice(isDepictedIn.indexOf(targetToRemove), 1);
        }

        if (targetsToRemove.length > 0) {
            // TODO adjust
            // this.documentEditChangeMonitor.setChanged();
        }

        if (isDepictedIn.length == 0) {
            this.document.resource.relations['isDepictedIn'] = [];
            this.documents = [];
            this.clearSelection();
        } else {
            this.loadImages();
        }
    }


    public getRemoveLinksTooltip(): string {

        return this.selected.length === 1
            ? this.i18n({ id: 'docedit.tabs.images.tooltips.removeLink', value: 'Verknüpfung löschen' })
            : this.i18n({ id: 'docedit.tabs.images.tooltips.removeLinks', value: 'Verknüpfungen löschen' });
    }


    private loadImages() {

        const imageDocPromises: any[] = [];
        this.documents = [];
        this.document.resource.relations['isDepictedIn'].forEach(id => {
            imageDocPromises.push(this.datastore.get(id));
        });

        Promise.all(imageDocPromises as any).then(docs => {
            this.documents = docs as any;
            this.documents.sort((a: IdaiFieldImageDocument, b: IdaiFieldImageDocument) => {
                return SortUtil.alnumCompare(a.resource.identifier, b.resource.identifier);
            });
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

        if (!this.documents || this.documents.length == 0) return;
        this.imageGrid.calcGrid();
    }


    public openImagePicker() {

        let imagePickerModal = this.modalService.open(ImagePickerComponent, { size: 'lg' });
        imagePickerModal.componentInstance.setDocument(this.document);

        imagePickerModal.result.then(
            (selectedImages: Array<IdaiFieldImageDocument>) => {
                this.addIsDepictedInRelations(selectedImages);

                // this.documentEditChangeMonitor.setChanged();
                // TODO adjust
            }
        ).catch(() => {
            // Cancel
        });
    }
}