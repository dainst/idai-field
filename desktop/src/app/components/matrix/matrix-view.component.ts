import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { isEmpty, on, is, not, isUndefined } from 'tsfun';
import { Datastore, FeatureDocument, FieldDocument, Document, Named, ProjectConfiguration,
    Relation, Labels, CategoryForm, Valuelist } from 'idai-field-core';
import { DoceditComponent } from '../docedit/docedit.component';
import { MatrixClusterMode, MatrixRelationsMode, MatrixState } from './matrix-state';
import { Loading } from '../widgets/loading';
import { DotBuilder } from './dot-builder';
import { MatrixSelection, MatrixSelectionMode } from './matrix-selection';
import { Edges, EdgesBuilder, GraphRelationsConfiguration } from './edges-builder';
import { TabManager } from '../../services/tabs/tab-manager';
import { MenuContext } from '../../services/menu-context';
import { Menus } from '../../services/menus';
import IS_CONTEMPORARY_WITH = Relation.Time.CONTEMPORARY;
import IS_BEFORE = Relation.Time.BEFORE;
import IS_AFTER = Relation.Time.AFTER;
import IS_ABOVE = Relation.Position.ABOVE;
import IS_BELOW = Relation.Position.BELOW;
import IS_CUT_BY = Relation.Position.CUTBY;
import CUTS = Relation.Position.CUTS;
import SAME_AS = Relation.SAME_AS;

const Viz = require('viz.js');

const SUPPORTED_OPERATION_CATEGORIES = ['Trench', 'ExcavationArea'];


@Component({
    templateUrl: './matrix-view.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * Responsible for the calculation of the graph.
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class MatrixViewComponent implements OnInit {

    /**
     * The latest svg calculated with GraphViz via DotBuilder based on our component's current settings.
     */
    public graph: string|undefined;

    public graphFromSelection: boolean = false;
    public selection: MatrixSelection = new MatrixSelection();

    public operations: Array<FieldDocument> = [];
    public selectedOperation: FieldDocument|undefined;
    public configuredOperationCategories: string[] = [];

    private featureDocuments: Array<FeatureDocument> = [];
    private totalFeatureDocuments: Array<FeatureDocument> = [];
    private operationsLoaded: boolean = false;


    constructor(private projectConfiguration: ProjectConfiguration,
                private datastore: Datastore,
                private modalService: NgbModal,
                private matrixState: MatrixState,
                private loading: Loading,
                private tabManager: TabManager,
                private menuService: Menus,
                private labels: Labels) {}


    public getDocumentLabel = (document: any) => Document.getLabel(document, this.labels);

    public getCategoryLabel = (categoryName: string) => this.labels.get(
        this.projectConfiguration.getCategory(categoryName)
    );

    public showNoResourcesWarning = () => !this.noOperations() && !this.noConfiguredOperationCategories()
        && this.noFeatures() && !this.loading.isLoading();

    public showNoOperationsWarning = () => !this.noConfiguredOperationCategories() && this.operationsLoaded
        && this.noOperations();

    public showNoConfiguredOperationCategoriesWarning = () => this.noConfiguredOperationCategories()
        && this.operationsLoaded;

    public showOperationSelector = () => !this.noOperations();

    public documentsSelected = () => this.selection.documentsSelected();

    public getSelectionMode = () => this.selection.getMode();

    public setSelectionMode = (selectionMode: MatrixSelectionMode) => this.selection.setMode(selectionMode);

    public clearSelection = () => this.selection.clear();

    private noConfiguredOperationCategories = () => isEmpty(this.configuredOperationCategories);

    private noOperations = () => isEmpty(this.operations);

    private noFeatures = () => isEmpty(this.featureDocuments);


    async ngOnInit() {

        await this.matrixState.load();
        await this.populateOperations();
        this.operationsLoaded = true;
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.DEFAULT) {
            await this.tabManager.openActiveTab();
        }
    }


    public async edit(resourceId: string) {

        await this.openEditorModal(
            this.featureDocuments.find(on(['resource','id'], is(resourceId))) as FeatureDocument
        );
    }


    public createGraphFromSelection() {

        if (!this.documentsSelected()) return;

        const selectedDocuments: Array<FeatureDocument>
            = this.selection.getSelectedDocuments(this.featureDocuments);
        this.selection.clear();
        this.selection.setMode('none');

        if (selectedDocuments.length === this.featureDocuments.length) return;

        this.featureDocuments = selectedDocuments;
        this.calculateGraph();

        this.graphFromSelection = true;
    }


    public async reloadGraph() {

        if (!this.selectedOperation || !this.graphFromSelection) return;

        await this.loadFeatureDocuments(this.selectedOperation);
        this.calculateGraph();

        this.graphFromSelection = false;
    }


    public calculateGraph() {

        const edges: { [resourceId: string]: Edges } = EdgesBuilder.build(
            this.featureDocuments,
            this.totalFeatureDocuments,
            MatrixViewComponent.getRelationConfiguration(this.matrixState.getRelationsMode())
        );

        const graph: string = DotBuilder.build(
            this.projectConfiguration,
            this.getPeriodMap(this.featureDocuments, this.matrixState.getClusterMode()),
            edges,
            this.matrixState.getLineMode() === 'curved'
        );

        this.graph = Viz(graph, { format: 'svg', engine: 'dot' }) as string;
    }


    private async populateOperations(): Promise<void> {

        this.configuredOperationCategories = SUPPORTED_OPERATION_CATEGORIES.map(categoryName => {
            return this.projectConfiguration.getCategory(categoryName)?.name
        }).filter(not(isUndefined));
        if (this.configuredOperationCategories.length === 0) return;

        this.operations = (await this.datastore.find({ categories: SUPPORTED_OPERATION_CATEGORIES }))
            .documents as Array<FieldDocument>;
        if (this.operations.length === 0) return;

        const previouslySelectedOperation: FieldDocument = this.operations
            .find(on(['resource','id'], is(this.matrixState.getSelectedOperationId())));
        if (previouslySelectedOperation) return this.selectOperation(previouslySelectedOperation);

        await this.selectOperation(this.operations[0]);
    }


    public async selectOperation(operation: FieldDocument) {

        if (operation === this.selectedOperation) return;

        this.selection.clear(false);

        this.selectedOperation = operation;
        this.matrixState.setSelectedOperationId(this.selectedOperation.resource.id);
        this.featureDocuments = [];
        this.graphFromSelection = false;
        this.graph = undefined;

        await this.loadFeatureDocuments(operation);
        this.calculateGraph();
    }


    private async loadFeatureDocuments(operation: FieldDocument) {

        this.loading.start();

        const categories = this.projectConfiguration.getFeatureCategories().map(Named.toName);

        const result = await this.datastore.find({
            constraints: { 'isChildOf:contain': { value: operation.resource.id, searchRecursively: true } },
            categories: categories
        });
        this.totalFeatureDocuments = this.featureDocuments = result.documents as Array<FeatureDocument>;

        this.loading.stop();
    }


    private async openEditorModal(docToEdit: FeatureDocument) {

        this.menuService.setContext(MenuContext.DOCEDIT);

        const doceditRef = this.modalService.open(DoceditComponent,
            { size: 'lg', backdrop: 'static', keyboard: false, animation: false });
        doceditRef.componentInstance.setDocument(docToEdit);

        const reset = async () => {
            this.featureDocuments = [];
            this.selectedOperation = undefined;
            await this.populateOperations();
        };

        await doceditRef.result
            .then(reset, reason => {
                this.menuService.setContext(MenuContext.DEFAULT);
                if (reason === 'deleted') return reset();
            });
    }


    private getPeriodMap(documents: Array<FeatureDocument>, clusterMode: MatrixClusterMode)
        : { [period: string]: Array<FeatureDocument> } {

        if (clusterMode === 'none') return { 'UNKNOWN': documents };

        return documents.reduce((periodMap: any, document: FeatureDocument) => {
            const period: string = this.getPeriodLabel(document);
            if (!periodMap[period]) periodMap[period] = [];
            periodMap[period].push(document);
            return periodMap;
        }, {});
    }
    

    private getPeriodLabel(document: FeatureDocument): string {

        const value: string|undefined = document.resource.period?.value;
        if (!value) return 'UNKNOWN';

        const valuelist: Valuelist = CategoryForm.getField(
            this.projectConfiguration.getCategory(document.resource.category),
            'period'
        )?.valuelist;

        return valuelist
            ? this.labels.getValueLabel(valuelist, value)
            : value;
    }

    private static getRelationConfiguration(relationsMode: MatrixRelationsMode): GraphRelationsConfiguration {

        return relationsMode === 'temporal'
            ? {
                above: [IS_AFTER],
                below: [IS_BEFORE],
                sameRank: [IS_CONTEMPORARY_WITH, SAME_AS]
            }
            : {
                above: [IS_ABOVE, CUTS],
                below: [IS_BELOW, IS_CUT_BY],
                sameRank: [SAME_AS]
            };
    }
}
