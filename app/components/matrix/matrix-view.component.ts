import {Component, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {ProjectConfiguration} from 'idai-components-2/core';
import {IdaiFieldFeatureDocument} from 'idai-components-2/field';
import {isNot, on, tripleEqual, doWhen, isEmpty} from 'tsfun';
import {IdaiFieldDocumentReadDatastore} from '../../core/datastore/field/idai-field-document-read-datastore';
import {ModelUtil} from '../../core/model/model-util';
import {DoceditComponent} from '../docedit/docedit.component';
import {MatrixRelationsMode, MatrixState} from './matrix-state';
import {IdaiFieldFeatureDocumentReadDatastore} from '../../core/datastore/field/idai-field-feature-document-read-datastore';
import {Loading} from '../../widgets/loading';
import {DotBuilder, GraphRelationsConfiguration} from './dot-builder';


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
     * the latest svg calculated with graphviz via dot-builder
     * based on our component's current settings.
     */
    public graph: string;

    private trenches: Array<IdaiFieldDocument> = [];
    private selectedTrench: IdaiFieldDocument|undefined;

    private featureDocuments: Array<IdaiFieldFeatureDocument> = [];
    private subgraphSelection: Array<IdaiFieldFeatureDocument> = []; // see selectionMode

    public selectionMode: boolean = false; // false is edit mode, true is selection mode


    constructor(
        private datastore: IdaiFieldDocumentReadDatastore,
        private projectConfiguration: ProjectConfiguration,
        private featureDatastore: IdaiFieldFeatureDocumentReadDatastore,
        private modalService: NgbModal,
        private matrixState: MatrixState,
        private loading: Loading
    ) {}


    public getDocumentLabel = (document: any) => ModelUtil.getDocumentLabel(document);

    public showGraph = () => !this.noTrenches() && !this.noFeatures();

    public showNoResourcesWarning = () => !this.noTrenches() && this.noFeatures() && !this.loading.isLoading();

    public showNoTrenchesWarning = () => this.noTrenches();

    public showTrenchSelector = () => !this.noTrenches();

    private noTrenches = () => isEmpty(this.trenches);

    private noFeatures = () => isEmpty(this.featureDocuments);


    async ngOnInit() {

        await this.matrixState.load();
        await this.populateTrenches();
    }


    public async select(resourceId: string) {

        const selectedDocument = this.featureDocuments.find(on('resource.id:')(resourceId));
        if (!selectedDocument) return;

        if (!this.selectionMode) {
            await this.launchDocedit(selectedDocument);
        } else {
            this.subgraphSelection = MatrixViewComponent.addOrRemove(this.subgraphSelection, selectedDocument);
        }
    }


    public async launchDocedit(docToEdit: IdaiFieldFeatureDocument) {

        const doceditRef = this.modalService.open(DoceditComponent,
            { size: 'lg', backdrop: 'static', keyboard: false });
        doceditRef.componentInstance.setDocument(docToEdit);

        const reset = async () => {
            this.featureDocuments = [];
            this.selectedTrench = undefined;
            await this.populateTrenches();
        };

        await doceditRef.result.then(reset, doWhen(tripleEqual('deleted'), reset));
    }


    public async subgraphActivateDeactivate() {

        if (!this.selectionMode) {
            if (this.selectedTrench) {
                await this.loadFeatureDocuments(this.selectedTrench);
            }
        } else {
            if (this.subgraphSelection.length > 0) {
                this.featureDocuments = this.subgraphSelection;
                this.subgraphSelection = [];
            }
            this.selectionMode = false;
        }

        this.calculateGraph();
    }


    public toggleSubgraphSelection() {

        this.selectionMode = !this.selectionMode;
        if (this.selectionMode) this.subgraphSelection = [];
    }


    public calculateGraph() {

        const graph: string = DotBuilder.build(
            this.projectConfiguration,
            MatrixViewComponent.getPeriodMap(this.featureDocuments, this.matrixState.getClusterMode()),
            MatrixViewComponent.getRelationConfiguration(this.matrixState.getRelationsMode()),
            this.matrixState.getLineMode() === 'curved');

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


    private async selectTrench(trench: IdaiFieldDocument) {

        if (trench == this.selectedTrench) return;

        this.selectedTrench = trench;
        this.matrixState.setSelectedTrenchId(this.selectedTrench.resource.id);
        this.featureDocuments = [];

        await this.loadFeatureDocuments(trench);
        this.calculateGraph();
    }


    private async loadFeatureDocuments(trench: IdaiFieldDocument) {

        this.loading.start();

        this.featureDocuments = (await this.featureDatastore.find( {
            constraints: { 'isRecordedIn:contain': trench.resource.id }
        })).documents;

        this.loading.stop();
    }


    private static addOrRemove(subgraphSelection: Array<IdaiFieldFeatureDocument>,
                               docToAddOrRemove: IdaiFieldFeatureDocument) {

        return !subgraphSelection
            .find(on('resource.id')(docToAddOrRemove))
            ? subgraphSelection.concat([docToAddOrRemove])
            : subgraphSelection
                .filter(isNot(on('resource.id')(docToAddOrRemove)));
    }


    private static getPeriodMap(documents: Array<IdaiFieldFeatureDocument>, clusterMode: 'periods'|'none')
            : { [period: string]: Array<IdaiFieldFeatureDocument> } {

        if (clusterMode === 'none') return { 'UNKNOWN': documents };

        return documents.reduce((periodMap: any, document: IdaiFieldFeatureDocument) => {
            const period: string = document.resource.hasPeriod
                || document.resource.hasPeriodBeginning // TODO Remove
                || 'UNKNOWN';
            if (!periodMap[period]) periodMap[period] = [];
            periodMap[period].push(document);
            return periodMap;
        }, {});
    }


    private static getRelationConfiguration(relationsMode: MatrixRelationsMode): GraphRelationsConfiguration {

        return relationsMode === 'temporal'
            ? { above: 'isAfter', below: 'isBefore', sameRank: 'isContemporaryWith' }
            : { above: 'isAbove', below: 'isBelow', sameRank: 'borders' };
    }
}