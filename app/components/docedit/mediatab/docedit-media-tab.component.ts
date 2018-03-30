import {Component, Input, ViewChild} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {IdaiFieldImageDocument} from '../../../core/model/idai-field-image-document';
import {MediaResourcePickerComponent} from './media-resource-picker.component';
import {ImageGridComponent} from '../../imagegrid/image-grid.component';
import {IdaiField3DDocument} from '../../../core/model/idai-field-3d-document';
import {IdaiFieldMediaDocumentReadDatastore} from '../../../core/datastore/idai-field-media-document-read-datastore';

@Component({
    selector: 'docedit-media-tab',
    moduleId: module.id,
    templateUrl: './docedit-media-tab.html'
})
/**
 * @author F.Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DoceditMediaTabComponent {

    @ViewChild('imageGrid') public imageGrid: ImageGridComponent;
    public documents: Array<IdaiFieldImageDocument|IdaiField3DDocument>;

    public selected: Array<IdaiFieldImageDocument|IdaiField3DDocument> = [];

    @Input() document: IdaiFieldDocument;


    constructor(
        private datastore: IdaiFieldMediaDocumentReadDatastore,
        private modalService: NgbModal,
        private documentEditChangeMonitor: DocumentEditChangeMonitor
    ) {
    }


    ngOnChanges() {

        if (!this.document) return;
        if (this.document.resource.relations['isDepictedIn']) {
            this.loadMediaResources();
        }
    }


    /**
     * @param document the object that should be selected
     */
    public select(document: IdaiFieldImageDocument|IdaiField3DDocument) {

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

        if (targetsToRemove.length > 0) this.documentEditChangeMonitor.setChanged();

        if (isDepictedIn.length == 0) {
            this.document.resource.relations['isDepictedIn'] = [];
            this.documents = [];
            this.clearSelection();
        } else {
            this.loadMediaResources();
        }
    }


    private loadMediaResources() {

        const promises: Array<Promise<IdaiFieldImageDocument|IdaiField3DDocument>> = [];
        this.documents = [];
        this.document.resource.relations['isDepictedIn'].forEach(id => {
            promises.push(this.datastore.get(id));
        });

        Promise.all(promises as any).then(docs => {
            this.documents = docs as Array<IdaiFieldImageDocument|IdaiField3DDocument>;
            this.clearSelection();
        });
    }


    private addIsDepictedInRelations(mediaDocuments: Array<IdaiFieldImageDocument|IdaiField3DDocument>) {

        const relations = this.document.resource.relations['isDepictedIn']
            ? this.document.resource.relations['isDepictedIn'].slice() : [];

        for (let mediaDocument of mediaDocuments) {
            if (!relations.includes(mediaDocument.resource.id as any)) {
                relations.push(mediaDocument.resource.id as any);
            }
        }

        this.document.resource.relations['isDepictedIn'] = relations;

        this.loadMediaResources();
    }


    public onResize() {

        if (!this.documents || this.documents.length == 0) return; // TODO code duplicated - move it to _onResize

        this.imageGrid.calcGrid();
    }


    public openMediaResourcePicker() {

        const modal = this.modalService.open(MediaResourcePickerComponent, { size: 'lg' });
        modal.componentInstance.setDocument(this.document);

        modal.result.then(
            (selectedMediaResources: Array<IdaiFieldImageDocument|IdaiField3DDocument>) => {
                this.addIsDepictedInRelations(selectedMediaResources);
                this.documentEditChangeMonitor.setChanged();
            }
        ).catch(() => {
            // Cancel
        });
    }
}