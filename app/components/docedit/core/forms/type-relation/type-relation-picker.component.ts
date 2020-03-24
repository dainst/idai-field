import {Component} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Pair, to, isNot, undefinedOrEmpty, left, on, includedIn, right, map, flow, empty, prune,
    is} from 'tsfun';
import {map as asyncMap} from 'tsfun/async';
import {FieldDocument, FieldResource, Resource, Query, Constraint, Document,
    FindResult} from 'idai-components-2';
import {FieldReadDatastore} from '../../../../../core/datastore/field/field-read-datastore';
import {TypeImagesUtil} from '../../../../../core/util/type-images-util';
import getLinkedImages = TypeImagesUtil.getLinkedImages;
import {ImageRowItem} from '../../../../image/row/image-row.component';
import {TypeRelations} from '../../../../../core/model/relation-constants';
import {ProjectConfiguration} from '../../../../../core/configuration/project-configuration';
import {Category} from '../../../../../core/configuration/model/category';
import {ValuelistDefinition} from '../../../../../core/configuration/model/valuelist-definition';
import {Group} from '../../../../../core/configuration/model/group';
import {FieldDefinition} from '../../../../../core/configuration/model/field-definition';
import {ValuelistUtil} from '../../../../../core/util/valuelist-util';


const CRITERION = 'criterion';
const TYPECATALOG = 'TypeCatalog';
const TYPE = 'Type';


type Criterion = {
    name: string;
    label: string;
}


@Component({
    selector: 'type-relation-picker',
    moduleId: module.id,
    templateUrl: './type-relation-picker.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class TypeRelationPickerComponent {

    public resource: Resource|undefined = undefined;

    public q: string = '';
    public selectedCatalog: FieldResource|undefined;
    public availableCatalogs: Array<FieldResource> = [];
    public selectedCriterion: string = '';
    public availableCriteria: Array<Criterion> = [];

    public timeoutRef: any;

    public typeDocument = left;
    public images = right;
    public typeDocumentsWithLinkedImages: Array<Pair<FieldDocument, Array<ImageRowItem>>> = [];


    constructor(public activeModal: NgbActiveModal,
                public datastore: FieldReadDatastore,
                public i18n: I18n,
                projectConfiguration: ProjectConfiguration) {

        this.initialize(projectConfiguration.getCategoriesMap()[TYPECATALOG]);
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
        this.selectedCatalog = undefined;
        await this.fetchTypes();
    }


    public setQueryString(q: string) {

        this.q = q;
        if (this.timeoutRef) clearTimeout(this.timeoutRef);
        this.timeoutRef = setTimeout(() => this.fetchTypes(), 200);
    }


    private async initialize(typeCatalogCategory: Category) {

        const usedCriteria = await this.getUsedCatalogCriteria();

        this.availableCriteria = TypeRelationPickerComponent.getConfiguredCriteria(typeCatalogCategory)
            .filter(on('name', includedIn(usedCriteria)));

        this.fetchCatalogs();
    }


    private async getUsedCatalogCriteria(): Promise<string[]> {

        return flow(
            await this.datastore.find({ categories: [TYPECATALOG] }),
            to(FindResult.DOCUMENTS),
            map(to(Document.RESOURCE)),
            map(to(CRITERION)),
            prune);
    }


    private async fetchCatalogs() {

        const query: Query = {
            categories: [TYPECATALOG],
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

        const query = TypeRelationPickerComponent.constructQuery(
            this.resource,
            this.q,
            this.selectedCatalog
                ? [this.selectedCatalog]
                : this.availableCatalogs
        );

        const documents = (await this.datastore.find(query)).documents;
        this.typeDocumentsWithLinkedImages = await this.pairWithLinkedImages(documents);
    }


    private pairWithLinkedImages = asyncMap(async (document: FieldDocument) => {

        return [
            document,
            await getLinkedImages(document, this.datastore)
        ] as Pair<FieldDocument, Array<ImageRowItem>>;
    });


    private static constructQuery(resource: Resource, q: string, selectedCatalogs: Array<FieldResource>) {

        const query: Query = {
            q: q,
            categories: [TYPE],
            limit: 5,
            sort: {
                matchCategory: resource.category,
                mode: Query.SORT_MODE_EXACTMATCHFIRST,
            },
            constraints: {}
        };
        if (isNot(undefinedOrEmpty)(resource.relations[TypeRelations.INSTANCEOF])) {
            (query.constraints as any)['id:match'] = {
                value: resource.relations[TypeRelations.INSTANCEOF],
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


    private static getConfiguredCriteria(typeCatalogCategory: Category): Array<Criterion> {

        const identificationGroup: Group = typeCatalogCategory.groups
            .find(on('name', is('identification'))) as Group;

        const criterionField: FieldDefinition = identificationGroup.fields
            .find(on('name', is('criterion'))) as FieldDefinition;

        const valuelist: ValuelistDefinition = (criterionField.valuelist as ValuelistDefinition);

        return Object.keys(valuelist.values).map((valueName: string) => {
            return {
                name: valueName,
                label: ValuelistUtil.getValueLabel(valuelist, valueName)
            }
        });
    }
}