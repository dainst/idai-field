import {Component, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {ProjectConfiguration} from 'idai-components-2/core';
import {isNot, on, tripleEqual, doWhen, isEmpty} from 'tsfun';
import {IdaiFieldDocumentReadDatastore} from '../../core/datastore/field/idai-field-document-read-datastore';
import {ModelUtil} from '../../core/model/model-util';
import {DoceditComponent} from '../docedit/docedit.component';
import {MatrixState} from './matrix-state';
import {IdaiFieldFeatureDocumentReadDatastore} from '../../core/datastore/field/idai-field-feature-document-read-datastore';
import {IdaiFieldFeatureDocument} from 'idai-components-2/field';
import {Loading} from '../../widgets/loading';
import {DotBuilder} from './dot-builder';


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

    public clusterMode: 'periods'|'none' = 'periods';
    public lineMode: 'ortho'|'curved' = 'ortho';
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

        await this.populateTrenches();
    }


    public setLineMode(lineMode: 'ortho'|'curved') {

        this.lineMode = lineMode;
        this.calculateNewGraph();
    };


    public setClusterMode(clusterMode: 'periods'|'none') {

        this.clusterMode = clusterMode;
        this.calculateNewGraph();
    }


    public async select(resourceIdentifier: string) {

        const selectedDoc = this.featureDocuments.find(
            on('resource.identifier:')(resourceIdentifier));

        if (!selectedDoc) return;

        if (!this.selectionMode) {
            await this.launchDocedit(selectedDoc);
        } else {
            this.subgraphSelection = MatrixViewComponent
                .addOrRemove(this.subgraphSelection, selectedDoc);
        }
    }


    public async launchDocedit(docToEdit: IdaiFieldFeatureDocument) {

        const doceditRef = this.modalService.open(DoceditComponent,
            { size: 'lg', backdrop: 'static', keyboard: false });
        doceditRef.componentInstance.setDocument(docToEdit);

        const reset = () => {
            this.featureDocuments = [];
            this.selectedTrench = undefined;
            this.populateTrenches();
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

        this.calculateNewGraph();
    }


    public toggleSubgraphSelection(): void {

        this.selectionMode = !this.selectionMode;
        if (this.selectionMode) this.subgraphSelection = [];
    }


    private calculateNewGraph(): void {

        const graph: string = DotBuilder.build(
            this.projectConfiguration,
            MatrixViewComponent.getPeriodMap(this.featureDocuments, this.clusterMode),
            { above: 'isAfter', below: 'isBefore', sameRank: 'isContemporaryWith' },
            this.lineMode === 'curved');

        this.graph = Viz(graph, { format: 'svg', engine: 'dot' }) as string;
    }


    private async populateTrenches(): Promise<void> {

        this.trenches = (await this.datastore.find({ types: ['Trench'] })).documents;
        if (this.trenches.length === 0) return;

        const previouslySelectedTrench = this.trenches
            .find(on('resource.id:')(this.matrixState.selectedTrenchId));
        if (previouslySelectedTrench) return this.selectTrench(previouslySelectedTrench);

        this.matrixState.selectedTrenchId = this.trenches[0].resource.id;
        await this.selectTrench(this.trenches[0]);
    }


    private async selectTrench(trench: IdaiFieldDocument) {

        if (trench == this.selectedTrench) return;

        this.selectedTrench = trench;
        this.matrixState.selectedTrenchId = this.selectedTrench.resource.id;
        this.featureDocuments = [];

        await this.loadFeatureDocuments(trench);
        this.calculateNewGraph();
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
}