import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { isEmpty, flow, includedIn, is, left, map, Mapping, on, Pair, pairWith, prune, right, to,
    isUndefinedOrEmpty } from 'tsfun';
import { CategoryForm, Labels, Constraint, Datastore, Document, FieldDocument, FieldResource, Named,
    ProjectConfiguration, Query, Resource, Relation } from 'idai-field-core';
import { ImageRowItem } from '../../../../image/row/image-row';
import { LinkedImagesUtil } from '../../../../../util/linked-images-util';


const ALLCATALOGS = 'all-catalogs';
const NOCRITERION = 'no-criterion';
const CRITERION = 'criterion';
const IDENTIFICATION = 'identification';
const TYPECATALOG = 'TypeCatalog';

const DOCUMENT_LIMIT = 5;


type Criterion = {
    name: string;
    label: string;
}


@Component({
    selector: 'type-relation-picker',
    templateUrl: './type-relation-picker.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class TypeRelationPickerComponent {

    public selectedCatalog: FieldResource|undefined;
    public selectedCatalogIdentifier = ALLCATALOGS;
    public availableCatalogs: Array<FieldResource> = [];
    public selectedCriterion = NOCRITERION;
    public availableCriteria: Array<Criterion> = [];

    public typeDocumentsWithLinkedImages: Array<Pair<FieldDocument, Array<ImageRowItem>>> = [];
    public typeDocument = left;
    public images = right;

    public currentOffset = 0;
    public totalDocumentCount = 0;

    private resource: Resource|undefined = undefined;
    private q = '';
    private timeoutRef: any;


    constructor(public activeModal: NgbActiveModal,
                private datastore: Datastore,
                private projectConfiguration: ProjectConfiguration,
                private labels: Labels) {

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

        this.selectedCatalog = this.selectedCatalogIdentifier === ALLCATALOGS
            ? undefined
            : this.availableCatalogs.find(
                catalog => catalog.identifier === this.selectedCatalogIdentifier);

        this.currentOffset = 0;
        await this.fetchTypes();
    }


    public async onSelectCriterion() {

        await this.fetchCatalogs();
        this.selectedCatalog = undefined;
        this.selectedCatalogIdentifier = ALLCATALOGS;
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


    private async initialize(typeCatalogCategory: CategoryForm) {

        const usedCriteria = await this.getUsedCatalogCriteria();

        this.availableCriteria = TypeRelationPickerComponent.getConfiguredCriteria(typeCatalogCategory, this.labels)
            .filter(on(Named.NAME, includedIn(usedCriteria)));

        this.fetchCatalogs();
    }


    private async getUsedCatalogCriteria(): Promise<string[]> {

        return flow(
            await this.datastore.find({ categories: [TYPECATALOG] }),
            to(Datastore.FindResult.DOCUMENTS),
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
        if (this.selectedCriterion !== NOCRITERION) {
            query.constraints = { 'criterion:match': this.selectedCriterion };
        }

        const result = await this.datastore.find(query);
        this.availableCatalogs = flow(
            result.documents,
            map(to(Document.RESOURCE))
        );
    }


    private async fetchTypes() {

        if (!this.resource) return;

        const query = TypeRelationPickerComponent.constructQuery(
            this.resource,
            this.q,
            this.selectedCatalog
                ? [this.selectedCatalog]
                : this.availableCatalogs,
            this.currentOffset,
            this.projectConfiguration.getTypeCategories().map(to(Named.NAME))
        );

        const result = await this.datastore.find(query);
        this.totalDocumentCount = result.totalCount;
        this.typeDocumentsWithLinkedImages = this.pairWithLinkedImages(result.documents);
    }


    private pairWithLinkedImages: Mapping
        = (documents: Array<FieldDocument>) => map(documents, document => {
            return [
                document,
                LinkedImagesUtil.getLinkedImageIds(document, this.datastore, Relation.Type.INSTANCEOF)
                    .map(id => ({ imageId: id }))
            ] as Pair<FieldDocument, Array<ImageRowItem>>;
        })


    private static constructQuery(resource: Resource, q: string, selectedCatalogs: Array<FieldResource>,
                                  offset: number, typeCategoryNames: string[]) {

        const query: Query = {
            q,
            categories: typeCategoryNames,
            limit: DOCUMENT_LIMIT,
            offset,
            sort: {
                matchCategory: resource.category,
                mode: Query.SORT_MODE_EXACTMATCHFIRST,
            },
            constraints: {}
        };
        if (!isUndefinedOrEmpty(resource.relations[Relation.Type.INSTANCEOF])) {
            (query.constraints as any)['id:match'] = {
                value: resource.relations[Relation.Type.INSTANCEOF],
                subtract: true
            };
        }
        if (!isEmpty(selectedCatalogs)) {
            (query.constraints as any)['isChildOf:contain'] = {
                value: selectedCatalogs.map(to(Resource.ID)),
                searchRecursively: true
            } as Constraint;
        }

        return query;
    }


    private static getConfiguredCriteria(typeCatalogCategory: CategoryForm, labels: Labels): Array<Criterion> {

        const valuelistDefinition =
            typeCatalogCategory
                .groups
                .find(Named.onName(is(IDENTIFICATION)))
                .fields
                .find(Named.onName(is(CRITERION)))
                .valuelist;

        return labels.orderKeysByLabels(valuelistDefinition)
            .map(pairWith(name => labels.getValueLabel(valuelistDefinition, name)))
            .map(([name, label]) => ({ name, label }));
    }
    // TODO use curry or provide curried variant of getValueLabel
}
