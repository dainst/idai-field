import {Component, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {on, tripleEqual, isEmpty} from 'tsfun';
import {FieldDocument, ProjectConfiguration, FeatureDocument} from 'idai-components-2';
import {FieldReadDatastore} from '../../core/datastore/field/field-read-datastore';
import {ModelUtil} from '../../core/model/model-util';
import {DoceditComponent} from '../docedit/docedit.component';
import {MatrixClusterMode, MatrixRelationsMode, MatrixState} from './matrix-state';
import {FeatureReadDatastore} from '../../core/datastore/field/feature-read-datastore';
import {Loading} from '../../widgets/loading';
import {DotBuilder} from './dot-builder';
import {MatrixSelection, MatrixSelectionMode} from './matrix-selection';
import {Edges, EdgesBuilder, GraphRelationsConfiguration} from './edges-builder';


@Component({
    moduleId: module.id,
    templateUrl: './matrix-view.html'
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


    constructor(
        private datastore: FieldReadDatastore,
        private projectConfiguration: ProjectConfiguration,
        private featureDatastore: FeatureReadDatastore,
        private modalService: NgbModal,
        private matrixState: MatrixState,
        private loading: Loading
    ) {}


    public getDocumentLabel = (document: any) => ModelUtil.getDocumentLabel(document);

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


    public async edit(resourceId: string) {

        await this.openEditorModal(
            this.featureDocuments.find(on('resource.id:')(resourceId)) as FeatureDocument
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

        this.trenches = (await this.datastore.find({ types: ['Trench'] })).documents;
        if (this.trenches.length === 0) return;

        const previouslySelectedTrench = this.trenches
            .find(on('resource.id:')(this.matrixState.getSelectedTrenchId()));
        if (previouslySelectedTrench) return this.selectTrench(previouslySelectedTrench);

        await this.selectTrench(this.trenches[0]);
    }


    private async selectTrench(trench: FieldDocument) {

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

        this.totalFeatureDocuments = this.featureDocuments = (await this.featureDatastore.find( {
            constraints: { 'isRecordedIn:contain': trench.resource.id }
        })).documents;

        this.loading.stop();
    }


    private async openEditorModal(docToEdit: FeatureDocument) {

        const doceditRef = this.modalService.open(DoceditComponent,
            { size: 'lg', backdrop: 'static', keyboard: false });
        doceditRef.componentInstance.setDocument(docToEdit);

        const reset = async () => {
            this.featureDocuments = [];
            this.selectedTrench = undefined;
            await this.populateTrenches();
        };

        await doceditRef.result
            .then(reset, reason => { if (reason === 'deleted') return reset(); });
    }


    private static getPeriodMap(documents: Array<FeatureDocument>, clusterMode: MatrixClusterMode)
            : { [period: string]: Array<FeatureDocument> } {

        if (clusterMode === 'none') return { 'UNKNOWN': documents };

        return documents.reduce((periodMap: any, document: FeatureDocument) => {
            const period: string = document.resource.period || 'UNKNOWN';
            if (!periodMap[period]) periodMap[period] = [];
            periodMap[period].push(document);
            return periodMap;
        }, {});
    }


    private static getRelationConfiguration(relationsMode: MatrixRelationsMode): GraphRelationsConfiguration {

        return relationsMode === 'temporal'
            ? { above: ['isAfter'], below: ['isBefore'], sameRank: 'isContemporaryWith' }
            : { above: ['isAbove', 'cuts'], below: ['isBelow', 'isCutBy'] };
    }
}