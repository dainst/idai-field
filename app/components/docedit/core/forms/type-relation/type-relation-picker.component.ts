import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Pair, to, isNot, undefinedOrEmpty, left, right, map, flow, empty} from 'tsfun';
import {map as asyncMap} from 'tsfun/async';
import {FieldDocument, FieldResource, Resource, Query, Constraint, Document, FindResult} from 'idai-components-2';
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

    public q: string = '';
    public selectedCatalog: FieldResource|undefined;
    public availableCatalogs: Array<FieldResource> = [];
    public selectedCriterion: string = '';
    public selectionCriteria: string[] = ['material'];

    public timeoutRef: any;

    public typeDocument = left;
    public images = right;
    public typeDocumentsWithLinkedImages: Array<Pair<FieldDocument, Array<ImageRowItem>>> = [];


    constructor(public activeModal: NgbActiveModal,
                public datastore: FieldReadDatastore) {

        this.fetchCatalogs();
    }


    public setResource(resource: Resource) {

        this.resource = resource;
        this.fetchTypes();
    }


    public onSelectCatalog() {

        this.fetchTypes();
    }


    public async onSelectCriterion() {

        await this.fetchCatalogs();
        await this.fetchTypes();
    }


    public setQueryString(q: string) {

        this.q = q;
        if (this.timeoutRef) clearTimeout(this.timeoutRef);
        this.timeoutRef = setTimeout(() => this.fetchTypes(), 200);
    }


    private async fetchCatalogs() {

        const query = {
            types: ['TypeCatalog'],
            constraints: {}
        };
        if (this.selectedCriterion) query.constraints = { 'criterion:match': this.selectedCriterion };

        this.availableCatalogs =
            flow(
                await this.datastore.find(query),
                to(FindResult.DOCUMENTS),
                map(to(Document.RESOURCE)));
    }


    private async fetchTypes() {

        if (!this.resource) return;

        const query = TypeRelationPickerComponent
            .constructQuery(
                this.resource,
                this.q,
                this.selectedCatalog
                    ? [this.selectedCatalog]
                    : this.availableCatalogs);

        const documents = (await this.datastore.find(query)).documents;
        this.typeDocumentsWithLinkedImages = await this.pairWithLinkedImages(documents);
    }


    private pairWithLinkedImages = asyncMap(async (document: FieldDocument) => {
        return [
            document,
            await getLinkedImages(document, this.datastore)
        ] as Pair<FieldDocument, Array<ImageRowItem>>;
    });


    private static constructQuery(resource: Resource,
                                  q: string,
                                  selectedCatalogs: Array<FieldResource>) {

        const query: Query = {
            q: q,
            types: ['Type'],
            limit: 5,
            sort: {
                matchType: resource.type,
                mode: 'exactMatchFirst',
            },
            constraints: {}
        };
        if (isNot(undefinedOrEmpty)(resource.relations['isInstanceOf'])) {
            (query.constraints as any)['id:match'] = {
                value: resource.relations['isInstanceOf'],
                subtract: true
            };
        }
        if (isNot(empty)(selectedCatalogs)) {
            (query.constraints as any)['liesWithin:contain'] = {
                value: selectedCatalogs.map(to(Resource.ID)),
                searchRecursively: true
            } as Constraint;
        }
        return query;
    }
}