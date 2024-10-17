import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Graphviz } from '@hpcc-js/wasm-graphviz';
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
import BONDS_WITH = Relation.Position.BONDSWITH;
import ABUTS = Relation.Position.ABUTS;
import IS_ABUTTED_BY = Relation.Position.ABUTTEDBY;
import FILLS = Relation.Position.FILLS;
import IS_FILLED_BY = Relation.Position.FILLEDBY;
import SAME_AS = Relation.SAME_AS;
import { exportGraph } from './export-graph';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { AppState } from '../../services/app-state';
import { Messages } from '../messages/messages';
import { M } from '../messages/m';
import { AngularUtility } from '../../angular/angular-utility';

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

    public dotGraph: string|undefined;
    public graph: string|undefined;

    public graphFromSelection: boolean = false;
    public selection: MatrixSelection = new MatrixSelection();

    public operations: Array<FieldDocument> = [];
    public selectedOperation: FieldDocument|undefined;
    public configuredOperationCategories: string[] = [];
    public graphvizFailure: boolean = false;

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
                private labels: Labels,
                private settingsProvider: SettingsProvider,
                private appState: AppState,
                private messages: Messages) {}


    public getDocumentLabel = (document: any) => Document.getLabel(document, this.labels, this.projectConfiguration);

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


    public async calculateGraph() {

        this.dotGraph = undefined;
        this.graph = undefined;
        this.graphvizFailure = false;
        let dotGraph: string;

        this.loading.start();

        await AngularUtility.blurActiveElement();
        await AngularUtility.refresh(500);

        try {
            const edges: { [resourceId: string]: Edges } = EdgesBuilder.build(
                this.featureDocuments,
                this.totalFeatureDocuments,
                MatrixViewComponent.getRelationConfiguration(this.matrixState.getRelationsMode())
            );
    
            dotGraph = DotBuilder.build(
                this.projectConfiguration,
                this.getPeriodMap(this.featureDocuments, this.matrixState.getClusterMode()),
                edges,
                this.matrixState.getLineMode() === 'curved'
            );
        } catch (err) {
            console.error(err);
            this.messages.add([M.MATRIX_ERROR_GENERIC]);
            return this.loading.stop();
        }
  
        try {
            const graphviz: Graphviz = await Graphviz.load();
            this.graph = graphviz.dot(dotGraph);
        } catch (err) {
            this.graphvizFailure = true;
        } finally {
            Graphviz.unload();
            this.dotGraph = dotGraph;
            this.loading.stop();
        }
    }

    public async exportGraph() {

        if (!this.dotGraph) return;

        try {
            await exportGraph(
                this.dotGraph,
                this.settingsProvider.getSettings().selectedProject,
                this.selectedOperation.resource.identifier,
                this.appState,
                this.modalService,
                $localize `:@@matrix.export.dotFile:Graphviz-Dot-Datei`
            ); 
            this.messages.add([M.EXPORT_SUCCESS]);
        } catch (err) {
            if (err != 'canceled') this.messages.add(err);
        }
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
        
        this.loading.start();

        await this.loadFeatureDocuments(operation);
        this.calculateGraph();

        this.loading.stop();
    }


    private async loadFeatureDocuments(operation: FieldDocument) {

        const categories = this.projectConfiguration.getFeatureCategories().map(Named.toName);

        const result = await this.datastore.find({
            constraints: { 'isChildOf:contain': { value: operation.resource.id, searchRecursively: true } },
            categories: categories
        });
        this.totalFeatureDocuments = this.featureDocuments = result.documents as Array<FeatureDocument>;
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
                above: [IS_ABOVE, CUTS, ABUTS, FILLS],
                below: [IS_BELOW, IS_CUT_BY, IS_ABUTTED_BY, IS_FILLED_BY],
                sameRank: [SAME_AS, BONDS_WITH]
            };
    }
}
