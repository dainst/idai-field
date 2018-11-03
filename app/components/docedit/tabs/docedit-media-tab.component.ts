import {Component, Input, ViewChild} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {IdaiFieldDocument} from 'idai-components-2';
import {ImageGridComponent} from '../../imagegrid/image-grid.component';
import {IdaiFieldMediaDocumentReadDatastore} from '../../../core/datastore/idai-field-media-document-read-datastore';
import {IdaiFieldMediaDocument} from '../../../core/model/idai-field-media-document';
import {MediaResourcePickerComponent} from '../widgets/media-resource-picker.component';

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

    @Input() document: IdaiFieldDocument;

    public documents: Array<IdaiFieldMediaDocument>;
    public selected: Array<IdaiFieldMediaDocument> = [];


    constructor(private datastore: IdaiFieldMediaDocumentReadDatastore,
                private modalService: NgbModal,
                private i18n: I18n) {}


    ngOnChanges() {

        if (!this.document) return;
        if (this.document.resource.relations['isDepictedIn']) {
            this.loadMediaResources();
        }
    }


    /**
     * @param document the object that should be selected
     */
    public select(document: IdaiFieldMediaDocument) {

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
            this.loadMediaResources();
        }
    }


    public getRemoveLinksTooltip(): string {

        return this.selected.length === 1
            ? this.i18n({ id: 'docedit.tabs.images.tooltips.removeLink', value: 'Verknüpfung löschen' })
            : this.i18n({ id: 'docedit.tabs.images.tooltips.removeLinks', value: 'Verknüpfungen löschen' });
    }


    private loadMediaResources() {

        const promises: Array<Promise<IdaiFieldMediaDocument>> = [];
        this.documents = [];
        this.document.resource.relations['isDepictedIn'].forEach(id => {
            promises.push(this.datastore.get(id));
        });

        Promise.all(promises as any).then(docs => {
            this.documents = docs as any;
            this.clearSelection();
        });
    }


    private addIsDepictedInRelations(mediaDocuments: Array<IdaiFieldMediaDocument>) {

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

        if (!this.documents || this.documents.length == 0) return;
        this.imageGrid.calcGrid();
    }


    public openMediaResourcePicker() {

        const modal = this.modalService.open(MediaResourcePickerComponent, { size: 'lg' });
        modal.componentInstance.setDocument(this.document);

        modal.result.then(
            (selectedMediaResources: Array<IdaiFieldMediaDocument>) => {
                this.addIsDepictedInRelations(selectedMediaResources);

                // this.documentEditChangeMonitor.setChanged();
                // TODO adjust
            }
        ).catch(() => {
            // Cancel
        });
    }
}