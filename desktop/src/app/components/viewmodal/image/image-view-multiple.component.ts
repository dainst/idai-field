import {Component, Input, OnChanges, ViewChild} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Datastore, FieldDocument, Document, ImageDocument} from 'idai-field-core';
import {ImageGridComponent} from '../../image/grid/image-grid.component';
import {SortUtil} from 'idai-field-core';
import {Relations} from 'idai-field-core';


@Component({
    selector: 'image-view-multiple',
    templateUrl: './image-view-multiple.html'
})
/**
 * @author F.Z.
 * @author Daniel de Oliveira
 */
export class ImageViewMultipleComponent implements OnChanges {

    @ViewChild('imageGrid', { static: false }) public imageGrid: ImageGridComponent;

    @Input() document: FieldDocument;

    public documents: Array<ImageDocument> = [];
    public selected: Array<ImageDocument> = [];


    constructor(private datastore: Datastore,
                private i18n: I18n) {}


    ngOnChanges() {

        if (!this.document) return;
        if (this.document.resource.relations[Relations.Image.ISDEPICTEDIN]) {
            this.loadImages();
        }
    }


    /**
     * @param document the object that should be selected
     */
    public select(document: ImageDocument) {

        if (this.selected.indexOf(document) === -1) this.selected.push(document);
        else this.selected.splice(this.selected.indexOf(document), 1);
    }


    public clearSelection() {

        this.selected = [];
    }


    public removeLinks() {

        const isDepictedIn = this.document.resource.relations[Relations.Image.ISDEPICTEDIN];
        const targetsToRemove = [];

        for (const target of isDepictedIn) {
            for (const sel of this.selected) {
                if (sel.resource.id === target) targetsToRemove.push(target);
            }
        }

        if (!targetsToRemove) return;

        for (const targetToRemove of targetsToRemove) {
            isDepictedIn.splice(isDepictedIn.indexOf(targetToRemove), 1);
        }

        if (isDepictedIn.length === 0) {
            this.document.resource.relations[Relations.Image.ISDEPICTEDIN] = [];
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


    public isMainImage(imageDocument: ImageDocument): boolean {

        return imageDocument.resource.id === this.document.resource.relations[Relations.Image.ISDEPICTEDIN][0];
    }


    public getMainImage(): ImageDocument|undefined {

        return this.documents.find(document => this.isMainImage(document));
    }


    public setMainImage() {

        if (this.selected.length !== 1) return;

        const mainImageId: string = this.selected[0].resource.id;

        this.document.resource.relations[Relations.Image.ISDEPICTEDIN] = [mainImageId].concat(
            this.document.resource.relations[Relations.Image.ISDEPICTEDIN].filter(targetId => {
                return targetId !== mainImageId;
            })
        );

        this.loadImages();
    }


    private loadImages() {

        const imageDocPromises: Array<Promise<Document>> = [];
        this.documents = [];
        this.document.resource.relations[Relations.Image.ISDEPICTEDIN].forEach(id => {
            imageDocPromises.push(this.datastore.get(id));
        });

        Promise.all(imageDocPromises).then(docs => {
            this.documents = docs as Array<ImageDocument>;
            this.documents.sort((a, b) => {
                return SortUtil.alnumCompare(a.resource.identifier, b.resource.identifier);
            });
            this.clearSelection();
        });
    }


    public onResize() {

        if (!this.documents || this.documents.length === 0) return;
        this.imageGrid.calcGrid();
    }
}
