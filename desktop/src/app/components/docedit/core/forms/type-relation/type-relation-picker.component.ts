import { Component } from '@angular/core';
import { Category, Constraint, DocumentDatastore, FieldDefinition, FieldDocument, FieldResource, FindResult, Group, onName, Query, TypeRelations, ValuelistDefinition } from 'idai-field-core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Document, Resource } from 'idai-field-core';
import {
    empty, flow, includedIn,
    is, isNot, left, map, Mapping, on, Pair, prune, right, to, undefinedOrEmpty
} from 'tsfun';
import { ProjectConfiguration } from '../../../../../core/configuration/project-configuration';
import { ImageDatastore } from '../../../../../core/datastore/field/image-datastore';
import { ImageRowItem } from '../../../../../core/images/row/image-row';
import { TypeImagesUtil } from '../../../../../core/util/type-images-util';
import { ValuelistUtil } from '../../../../../core/util/valuelist-util';


const CRITERION = 'criterion';
const TYPECATALOG = 'TypeCatalog';
const TYPE = 'Type';

const DOCUMENT_LIMIT: number = 5;


type Criterion = {
    name: string;
    label: string;
}


@Component({
    selector: 'type-relation-picker',
    templateUrl: './type-relation-picker.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class TypeRelationPickerComponent {

    public selectedCatalog: FieldResource|undefined;
    public availableCatalogs: Array<FieldResource> = [];
    public selectedCriterion: string = '';
    public availableCriteria: Array<Criterion> = [];

    public typeDocumentsWithLinkedImages: Array<Pair<FieldDocument, Array<ImageRowItem>>> = [];
    public typeDocument = left;
    public images = right;

    public currentOffset: number = 0;
    public totalDocumentCount: number = 0;

    private resource: Resource|undefined = undefined;
    private q: string = '';
    private timeoutRef: any;


    constructor(public activeModal: NgbActiveModal,
                private datastore: DocumentDatastore,
                private imageDatastore: ImageDatastore,
                projectConfiguration: ProjectConfiguration) {

        this.initialize(projectConfiguration.getCategory(TYPECATALOG));
    }


    public getCurrentPage = () => this.currentOffset ? (this.currentOffset / DOCUMENT_LIMIT) + 1 : 1;

    public getPageCount = () => this.totalDocumentCount ? Math.ceil(this.totalDocumentCount / DOCUMENT_LIMIT) : 1;

    public canTurnPage = () => (this.currentOffset + DOCUMENT_LIMIT) < this.totalDocumentCount;

    public canTurnPageBack = () => this.currentOffset > 0;


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.close();
    }


    public async setResource(resource: Resource) {

        this.resource = resource;
        this.currentOffset = 0;
        await this.fetchTypes();
    }


    public async onSelectCatalog() {

        this.currentOffset = 0;
        await this.fetchTypes();
    }


    public async onSelectCriterion() {

        await this.fetchCatalogs();
        this.selectedCatalog = undefined;
        this.currentOffset = 0;
        await this.fetchTypes();
    }


    public setQueryString(q: string) {

        this.q = q;
        if (this.timeoutRef) clearTimeout(this.timeoutRef);
        this.timeoutRef = setTimeout(() => {
            this.currentOffset = 0;
            this.fetchTypes();
        }, 200);
    }


    public async turnPage() {

        if (!this.canTurnPage()) return;

        this.currentOffset += DOCUMENT_LIMIT;
        await this.fetchTypes();
    }


    public async turnPageBack() {

        if (!this.canTurnPageBack()) return;

        this.currentOffset -= DOCUMENT_LIMIT;
        await this.fetchTypes();
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
            prune as any
        );
    }


    private async fetchCatalogs() {

        const query: Query = {
            categories: [TYPECATALOG],
            constraints: {}
        };
        if (this.selectedCriterion) query.constraints = { 'criterion:match': this.selectedCriterion };

        this.availableCatalogs = flow(
            await this.datastore.find(query),
            to(FindResult.DOCUMENTS),
            map(to(Document.RESOURCE))
        ) as any /* TODO review any*/;
    }


    private async fetchTypes() {

        if (!this.resource) return;

        const query = TypeRelationPickerComponent.constructQuery(
            this.resource,
            this.q,
            this.selectedCatalog
                ? [this.selectedCatalog]
                : this.availableCatalogs,
            this.currentOffset
        );

        const result: FindResult = await this.datastore.find(query);
        this.totalDocumentCount = result.totalCount;
        this.typeDocumentsWithLinkedImages = this.pairWithLinkedImages(result.documents);
    }


    private pairWithLinkedImages: Mapping
        = (documents: Array<FieldDocument>) => map((document: FieldDocument) => {
            return [
                document,
                TypeImagesUtil.getLinkedImageIds(document, this.datastore, this.imageDatastore)
                    .map(id => ({ imageId: id }))
            ] as Pair<FieldDocument, Array<ImageRowItem>>;
        })(documents);


    private static constructQuery(resource: Resource, q: string, selectedCatalogs: Array<FieldResource>,
                                  offset: number) {

        const query: Query = {
            q: q,
            categories: [TYPE],
            limit: DOCUMENT_LIMIT,
            offset: offset,
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
            .find(onName(is('identification')));

        const criterionField: FieldDefinition = identificationGroup.fields
            .find(onName(is('criterion')));

        const valuelist: ValuelistDefinition = (criterionField.valuelist as ValuelistDefinition);

        return ValuelistUtil.getOrderedValues(valuelist).map((valueName: string) => {
            return {
                name: valueName,
                label: ValuelistUtil.getValueLabel(valuelist, valueName)
            }
        });
    }
}
