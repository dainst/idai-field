import {Component, Input, ViewChild} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {FieldDocument, ImageDocument} from 'idai-components-2';
import {ImagePickerComponent} from '../widgets/image-picker.component';
import {ImageGridComponent} from '../../imagegrid/image-grid.component';
import {ImageReadDatastore} from '../../../core/datastore/field/image-read-datastore';
import {SortUtil} from '../../../core/util/sort-util';
import {DoceditComponent} from '../docedit.component';

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

    @Input() document: FieldDocument;

    public documents: Array<ImageDocument>;
    public selected: Array<ImageDocument> = [];


    constructor(private datastore: ImageReadDatastore,
                private modalService: NgbModal,
                private doceditComponent: DoceditComponent,
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
    public select(document: ImageDocument) {

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
            this.documents.sort((a: ImageDocument, b: ImageDocument) => {
                return SortUtil.alnumCompare(a.resource.identifier, b.resource.identifier);
            });
            this.clearSelection();
        });
    }


    private addIsDepictedInRelations(imageDocuments: ImageDocument[]) {

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


    public async openImagePicker() {

        this.doceditComponent.subModalOpened = true;

        if (document.activeElement) (document.activeElement as HTMLElement).blur();

        const imagePickerModal: NgbModalRef = this.modalService.open(
            ImagePickerComponent, { size: 'lg', keyboard: false }
        );
        imagePickerModal.componentInstance.setDocument(this.document);

        try {
            const selectedImages: Array<ImageDocument> = await imagePickerModal.result;
            this.addIsDepictedInRelations(selectedImages);
        } catch(err) {
            // Image picker modal has been canceled
        } finally {
            this.doceditComponent.subModalOpened = false;
        }
    }
}