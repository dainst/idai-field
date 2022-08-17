import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { isEmpty, on, is } from 'tsfun';
import { Datastore, FeatureDocument, FieldDocument, Document, Named, ProjectConfiguration,
    Relation, Labels } from 'idai-field-core';
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

    public trenches: Array<FieldDocument> = [];
    public selectedTrench: FieldDocument|undefined;

    private featureDocuments: Array<FeatureDocument> = [];
    private totalFeatureDocuments: Array<FeatureDocument> = [];
    private trenchesLoaded: boolean = false;


    constructor(private projectConfiguration: ProjectConfiguration,
                private datastore: Datastore,
                private modalService: NgbModal,
                private matrixState: MatrixState,
                private loading: Loading,
                private tabManager: TabManager,
                private menuService: Menus,
                private labels: Labels) {}


    public getDocumentLabel = (document: any) => Document.getLabel(document, this.labels);

    public showNoResourcesWarning = () => !this.noTrenches() && this.noFeatures() && !this.loading.isLoading();

    public showNoTrenchesWarning = () => this.trenchesLoaded && this.noTrenches();

    public showTrenchSelector = () => !this.noTrenches();

    public documentsSelected = () => this.selection.documentsSelected();

    public getSelectionMode = () => this.selection.getMode();

    public setSelectionMode = (selectionMode: MatrixSelectionMode) => this.selection.setMode(selectionMode);

    public clearSelection = () => this.selection.clear();

    private noTrenches = () => isEmpty(this.trenches);

    private noFeatures = () => isEmpty(this.featureDocuments);


    async ngOnInit() {

        await this.matrixState.load();
        await this.populateTrenches();
        this.trenchesLoaded = true;
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

        if (!this.selectedTrench || !this.graphFromSelection) return;

        await this.loadFeatureDocuments(this.selectedTrench);
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
            MatrixViewComponent.getPeriodMap(this.featureDocuments, this.matrixState.getClusterMode()),
            edges,
            this.matrixState.getLineMode() === 'curved'
        );

        this.graph = Viz(graph, { format: 'svg', engine: 'dot' }) as string;
    }


    private async populateTrenches(): Promise<void> {

        if (!this.projectConfiguration.getCategory('Trench')) return;

        this.trenches = (await this.datastore.find({ categories: ['Trench'] })).documents as Array<FieldDocument>;
        if (this.trenches.length === 0) return;

        const previouslySelectedTrench = this.trenches
            .find(on(['resource','id'], is(this.matrixState.getSelectedTrenchId())));
        if (previouslySelectedTrench) return this.selectTrench(previouslySelectedTrench);

        await this.selectTrench(this.trenches[0]);
    }


    public async selectTrench(trench: FieldDocument) {

        if (trench === this.selectedTrench) return;

        this.selection.clear(false);

        this.selectedTrench = trench;
        this.matrixState.setSelectedTrenchId(this.selectedTrench.resource.id);
        this.featureDocuments = [];
        this.graphFromSelection = false;
        this.graph = undefined;

        await this.loadFeatureDocuments(trench);
        this.calculateGraph();
    }


    private async loadFeatureDocuments(trench: FieldDocument) {

        this.loading.start();

        const categories = this.projectConfiguration.getFeatureCategories().map(Named.toName);

        const result = await this.datastore.find( {
            constraints: { 'isChildOf:contain': { value: trench.resource.id, searchRecursively: true } },
            categories: categories
        });
        this.totalFeatureDocuments = this.featureDocuments = result.documents as Array<FeatureDocument>;

        this.loading.stop();
    }


    private async openEditorModal(docToEdit: FeatureDocument) {

        this.menuService.setContext(MenuContext.DOCEDIT);

        const doceditRef = this.modalService.open(DoceditComponent,
            { size: 'lg', backdrop: 'static', keyboard: false });
        doceditRef.componentInstance.setDocument(docToEdit);

        const reset = async () => {
            this.featureDocuments = [];
            this.selectedTrench = undefined;
            await this.populateTrenches();
        };

        await doceditRef.result
            .then(reset, reason => {
                this.menuService.setContext(MenuContext.DEFAULT);
                if (reason === 'deleted') return reset();
            });
    }


    private static getPeriodMap(documents: Array<FeatureDocument>, clusterMode: MatrixClusterMode)
        : { [period: string]: Array<FeatureDocument> } {

        if (clusterMode === 'none') return { 'UNKNOWN': documents };

        return documents.reduce((periodMap: any, document: FeatureDocument) => {
            const period: string = document.resource.period?.value || 'UNKNOWN';
            if (!periodMap[period]) periodMap[period] = [];
            periodMap[period].push(document);
            return periodMap;
        }, {});
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
