import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output,
    ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { to, Map } from 'tsfun';
import { CategoryForm, Datastore, Resource, FieldDocument, Name, Named, Tree, ProjectConfiguration, PouchdbDatastore, 
    FieldGeometryType } from 'idai-field-core';
import { ViewFacade } from '../../components/resources/view/view-facade';
import { M } from '../messages/m';
import { Messages } from '../messages/messages';
import { ResourcesComponent } from './resources.component';
import { ComponentHelpers } from '../component-helpers';


export type PlusButtonStatus = 'enabled'|'disabled-hierarchy';


const KOREAN_FIELDWORK_FEATURE_CATEGORY = 'Feature';
const KOREAN_FIELDWORK_FEATURE_GEOMETRY_TYPE: FieldGeometryType = 'Polygon';
const KOREAN_FIELDWORK_FEATURE_DEFAULT_FIELD_VALUES: Map<any> = {
    featureRecordingStatus: 'candidate',
    geometrySource: 'tabletSketch',
    geometryConfidence: 'rough',
    featureGeometryEditStatus: 'roughSketch',
    featureInvestigationChecklist: []
};
const KOREAN_FIELDWORK_FEATURE_VALUELISTS: Map<string> = {
    featureRecordingStatus: 'KoreanFieldwork-featureRecordingStatus',
    geometrySource: 'KoreanFieldwork-geometrySource',
    geometryConfidence: 'KoreanFieldwork-geometryConfidence',
    featureGeometryEditStatus: 'KoreanFieldwork-featureGeometryEditStatus',
    featureInvestigationChecklist: 'KoreanFieldwork-featureInvestigationChecklist'
};


@Component({
    selector: 'plus-button',
    templateUrl: './plus-button.html',
    standalone: false
})

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class PlusButtonComponent implements OnInit, OnChanges, OnDestroy {

    @Input() placement: string = 'bottom'; // top | bottom | left | right

    // undefined when in overview, type management or inventory management
    @Input() isRecordedIn: FieldDocument|undefined;

    // undefined when current level is operation
    @Input() liesWithin: FieldDocument|undefined;

    @Input() preselectedCategory: string;
    @Input() preselectedGeometryType: string;
    @Input() skipFormAndReturnNewDocument: boolean = false;
    @Input() status: PlusButtonStatus = 'enabled';
    @Input() defaultFieldValues: Map<any> = {};

    @Output() documentRequested: EventEmitter<FieldDocument> = new EventEmitter<FieldDocument>();

    @ViewChild('popover', { static: false }) private popover: any;

    public selectedCategory: CategoryForm|undefined;
    public topLevelCategoriesArray: Array<CategoryForm>;

    private clickEventSubscription: Subscription;
    private changesSubscription: Subscription;


    constructor(private elementRef: ElementRef,
                private resourcesComponent: ResourcesComponent,
                private projectConfiguration: ProjectConfiguration,
                private messages: Messages,
                private viewFacade: ViewFacade,
                private datastore: Datastore,
                private pouchdbDatastore: PouchdbDatastore) {}


    public isGeometryCategory = (category: Name) => this.projectConfiguration.isGeometryCategory(category);


    ngOnInit() {
        
        this.clickEventSubscription = this.resourcesComponent.listenToClickEvents().subscribe(event => {
            this.handleClick(event);
        });

        this.changesSubscription = this.pouchdbDatastore.changesNotifications().subscribe(() => {
            this.initializeSelectableCategoriesArray(this.projectConfiguration);
        });
    }


    ngOnChanges() {

        this.initializeSelectableCategoriesArray(this.projectConfiguration);
    }


    ngOnDestroy() {
        
        if (this.clickEventSubscription) this.clickEventSubscription.unsubscribe();
        if (this.changesSubscription) this.changesSubscription.unsubscribe();
    }


    public async startDocumentCreation(geometryType: string = this.preselectedGeometryType) {

        if (this.popover) this.popover.close();

        try {
            await this.assertParentResourceStillExists();
        } catch (msgWithParams) {
            return this.messages.add(msgWithParams);
        }

        const newDocument: FieldDocument = <FieldDocument> {
            resource: {
                relations: this.createRelations(),
                category: this.selectedCategory.name
            }
        };

        Object.assign(newDocument.resource, this.getDefaultFieldValues(geometryType));

        if (this.skipFormAndReturnNewDocument) {
            this.documentRequested.emit(newDocument);
        } else {
            this.resourcesComponent.startEditNewDocument(newDocument, geometryType);
        }
    }


    public reset() {

        this.selectedCategory = this.getButtonType() === 'singleCategory'
            ? this.topLevelCategoriesArray[0]
            : undefined;
    }


    public getButtonType(): 'singleCategory'|'multipleCategories'|'none' {

        if (this.topLevelCategoriesArray.length === 0) return 'none';

        if (this.topLevelCategoriesArray.length === 1 && !this.topLevelCategoriesArray[0].children?.length) {
            return 'singleCategory';
        }

        return 'multipleCategories';
    }


    public chooseCategory(category: CategoryForm) {

        this.selectedCategory = category;

        if (this.preselectedGeometryType) {
            this.startDocumentCreation();
        } else if (!this.isGeometryCategory(this.selectedCategory.name)) {
            this.startDocumentCreation('none');
        }
    }


    public getTooltip(): string {

        switch(this.status) {
            case 'enabled':
                return '';
            case 'disabled-hierarchy':
                return $localize `:@@resources.plusButton.tooltip.deactivated:Bitte deaktivieren Sie den erweiterten Suchmodus, um neue Ressourcen anlegen zu können.`;
        }
    }


    public isAllowedGeometryType(geometryType: FieldGeometryType): boolean {
        
        return CategoryForm.isAllowedGeometryType(this.selectedCategory, geometryType);
    }


    public isFeatureQuickCreateVisible(): boolean {

        const featureCategory: CategoryForm|undefined = this.getKoreanFieldworkFeatureCategory();
        return !!featureCategory && CategoryForm.isAllowedGeometryType(
            featureCategory, KOREAN_FIELDWORK_FEATURE_GEOMETRY_TYPE
        );
    }


    public async startFeaturePolygonCreation() {

        this.selectedCategory = this.getKoreanFieldworkFeatureCategory();
        if (!this.selectedCategory) return;

        await this.startDocumentCreation(KOREAN_FIELDWORK_FEATURE_GEOMETRY_TYPE);
    }


    private handleClick(event: any) {

        if (!this.popover) return;

        if (!ComponentHelpers.isInside(event.target, target =>
                target === this.elementRef.nativeElement
                    || target.id === 'new-object-menu'
                    || target.id === 'geometry-type-selection')) {

            this.popover.close();
        }
    }


    private async initializeSelectableCategoriesArray(projectConfiguration: ProjectConfiguration) {

        this.topLevelCategoriesArray = [];

        if (this.preselectedCategory) {
            const category: CategoryForm = projectConfiguration.getCategory(this.preselectedCategory);
            if (category) this.topLevelCategoriesArray.push(category);
        } else {
            for (let category of Tree.flatten(projectConfiguration.getCategories())) {
                if (await this.isAllowedCategory(category, projectConfiguration)
                        && (!category.parentCategory
                            || !(await this.isAllowedCategory(category.parentCategory, projectConfiguration)))) {
                    this.topLevelCategoriesArray.push(category);
                }
            }
        }
    }


    private createRelations(): Resource.Relations {

        const relations: Resource.Relations = {};
        relations['isRecordedIn'] = this.isRecordedIn
            ? [this.isRecordedIn.resource.id]
            : [];

        if (this.liesWithin) relations['liesWithin'] = [this.liesWithin.resource.id];
        return relations;
    }


    private async isAllowedCategory(category: CategoryForm,
                                    projectConfiguration: ProjectConfiguration): Promise<boolean> {

        if (category.name === 'Image') return false;

        if (this.isRecordedIn) {
            if (!projectConfiguration.isAllowedRelationDomainCategory(category.name,
                this.isRecordedIn.resource.category, 'isRecordedIn')) {
                return false;
            }
        } else {
            const categories: Array<CategoryForm> = this.getCategories();
            if (!categories.map(Named.toName).includes(category.name)) return false;
        }

        if (!this.liesWithin) {
            if (category.mustLieWithin) return false;
        } else if (!projectConfiguration.isAllowedRelationDomainCategory(
                category.name, this.liesWithin.resource.category, 'liesWithin')) {
            return false;
        }

        if (category.resourceLimit) {
            const parentCategoryName: string = category.parentCategory?.name ?? category.name;
            const categoryNames: string[] = this.projectConfiguration.getCategoryWithSubcategories(parentCategoryName)
                .map(to(Named.NAME));
            const resourcesCount: number = await this.datastore.findIds({ categories: categoryNames }).totalCount;
            if (resourcesCount >= category.resourceLimit) return false;
        }

        return true;
    }


    private getCategories(): Array<CategoryForm> {

        if (this.viewFacade.isInOverview()) {
            return this.projectConfiguration.getConcreteOverviewCategories();
        } else if (this.viewFacade.isInTypesManagement()) {
            return this.projectConfiguration.getTypeManagementCategories();
        } else if (this.viewFacade.isInInventoryManagement()) {
            return this.projectConfiguration.getInventoryCategories();
        } else if (this.viewFacade.isInWorkflowManagement()) {
            return this.projectConfiguration.getCategory('Process').children;
        } else {
            console.error('Invalid view:', this.viewFacade.getView());
            return [];
        }
    }


    private findSelectableCategory(categoryName: string,
                                   categories: Array<CategoryForm> = this.topLevelCategoriesArray): CategoryForm|undefined {

        for (const category of categories ?? []) {
            if (category.name === categoryName) return category;

            const childCategory: CategoryForm|undefined = category.children
                ? this.findSelectableCategory(categoryName, category.children)
                : undefined;
            if (childCategory) return childCategory;
        }

        return undefined;
    }


    private getKoreanFieldworkFeatureCategory(): CategoryForm|undefined {

        const featureCategory: CategoryForm|undefined = this.findSelectableCategory(KOREAN_FIELDWORK_FEATURE_CATEGORY);
        return this.isKoreanFieldworkFeatureCategory(featureCategory)
            ? featureCategory
            : undefined;
    }


    private isKoreanFieldworkFeatureCategory(category: CategoryForm|undefined): boolean {

        if (category?.name !== KOREAN_FIELDWORK_FEATURE_CATEGORY) return false;

        return Object.keys(KOREAN_FIELDWORK_FEATURE_VALUELISTS).every(fieldName =>
            CategoryForm.getField(category, fieldName)?.valuelist?.id
                === KOREAN_FIELDWORK_FEATURE_VALUELISTS[fieldName]
        );
    }


    private getDefaultFieldValues(geometryType: string): Map<any> {

        const defaultFieldValues = { ...this.defaultFieldValues };

        if (this.isKoreanFieldworkFeatureCategory(this.selectedCategory) && geometryType !== 'none') {
            return {
                ...KOREAN_FIELDWORK_FEATURE_DEFAULT_FIELD_VALUES,
                ...defaultFieldValues
            };
        }

        return defaultFieldValues;
    }


    private async assertParentResourceStillExists() {

        try {
            if (this.isRecordedIn) await this.datastore.get(this.isRecordedIn.resource.id);
            if (this.liesWithin) await this.datastore.get(this.liesWithin.resource.id);
        } catch {
            throw [M.RESOURCES_ERROR_PARENT_RESOURCE_DELETED];
        }
    }
}
