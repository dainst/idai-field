import {Component, Input, ViewChild} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {IdaiFieldDocument} from 'idai-components-2';
import {ImageGridComponent} from '../../imagegrid/image-grid.component';
import {IdaiFieldMediaDocumentReadDatastore} from '../../../core/datastore/idai-field-media-document-read-datastore';
import {IdaiFieldMediaDocument} from '../../../core/model/idai-field-media-document';
import {MediaResourcePickerComponent} from '../widgets/media-resource-picker.component';
import {SortUtil} from '../../../core/util/sort-util';
import {DoceditComponent} from '../docedit.component';

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
                private doceditComponent: DoceditComponent,
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
            ? this.i18n({ id: 'docedit.tabs.media.tooltips.removeLink', value: 'Verknüpfung löschen' })
            : this.i18n({ id: 'docedit.tabs.media.tooltips.removeLinks', value: 'Verknüpfungen löschen' });
    }


    private loadMediaResources() {

        const promises: Array<Promise<IdaiFieldMediaDocument>> = [];
        this.documents = [];
        this.document.resource.relations['isDepictedIn'].forEach(id => {
            promises.push(this.datastore.get(id));
        });

        Promise.all(promises as any).then(docs => {
            this.documents = docs as any;
            this.documents.sort((a: IdaiFieldMediaDocument, b: IdaiFieldMediaDocument) => {
                return SortUtil.alnumCompare(a.resource.identifier, b.resource.identifier);
            });
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


    public async openMediaResourcePicker() {

        this.doceditComponent.subModalOpened = true;

        if (document.activeElement) (document.activeElement as HTMLElement).blur();
        
        const mediaResourcePickerModal: NgbModalRef = this.modalService.open(
            MediaResourcePickerComponent, { size: 'lg', keyboard: false }
        );
        mediaResourcePickerModal.componentInstance.setDocument(this.document);

        try {
            const selectedMediaResources: Array<IdaiFieldMediaDocument>
                = await mediaResourcePickerModal.result;
            this.addIsDepictedInRelations(selectedMediaResources);
        } catch(err) {
            // Media resource picker modal has been canceled
        } finally {
            this.doceditComponent.subModalOpened = false;
        }
    }
}