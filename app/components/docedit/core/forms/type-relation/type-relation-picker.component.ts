import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {first, Pair, second, to} from 'tsfun';
import {asyncMap} from 'tsfun-extra';
import {FieldDocument, FieldResource, Resource, Query} from 'idai-components-2';
import {FieldReadDatastore} from '../../../../../core/datastore/field/field-read-datastore';
import {TypeImagesUtil} from '../../../../../core/util/type-images-util';
import getLinkedImages = TypeImagesUtil.getLinkedImages;
import {ImageRowItem} from '../../../../image/row/image-row.component';


@Component({
    selector: 'type-relation-picker',
    moduleId: module.id,
    templateUrl: './type-relation-picker.html'
})
/**
 * @author Daniel de Oliveira
 */
export class TypeRelationPickerComponent {

    public resource: Resource|undefined = undefined;

    public selectedCatalog: FieldResource|undefined = undefined;
    public availableCatalogs: Array<FieldResource> = [];

    public timeoutRef: any;

    public typeDocument = first;
    public images = second;
    public typeDocumentsWithLinkedImages: Array<Pair<FieldDocument, Array<ImageRowItem>>> = [];


    constructor(public activeModal: NgbActiveModal,
                public datastore: FieldReadDatastore) {

        this.fetchCatalogs();
    }


    public setResource(resource: Resource) {

        this.resource = resource;
        this.fetchTypes();
    }


    public selectCatalog() {

        this.fetchTypes(); // TODO set query string
    }


    public setQueryString(q: string) {

        if (this.timeoutRef) clearTimeout(this.timeoutRef);
        this.timeoutRef = setTimeout(() => this.fetchTypes(q), 200);
    }


    private async fetchCatalogs() {

        this.availableCatalogs =
            (await this.datastore.find({ types: ['TypeCatalog'] }))
                .documents
                .map(to('resource'));
    }


    private async fetchTypes(q: string = '') {

        if (!this.resource) return;

        const query: Query = {
            q: q,
            types: ['Type'],
            sort: {
                matchType: this.resource.type,
                mode: 'exactMatchFirst', // TODO test manually once
            }
        };
        if (this.selectedCatalog) {
            query.constraints = {'liesWithin:contain': this.selectedCatalog.id}; // TODO also handle subcatalogs
        }

        const rankedDocuments = (await this.datastore.find(query)).documents;

        this.typeDocumentsWithLinkedImages = await this.pairWithLinkedImages(rankedDocuments);
    }


    private pairWithLinkedImages = asyncMap(async (document: FieldDocument) => {
        return [
            document,
            await getLinkedImages(document, this.datastore)
        ] as Pair<FieldDocument, Array<ImageRowItem>>;
    });
}