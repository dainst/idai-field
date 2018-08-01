import {Component, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {IdaiFieldDocumentReadDatastore} from '../../core/datastore/field/idai-field-document-read-datastore';
import {ModelUtil} from '../../core/model/model-util';
import {DoceditComponent} from '../docedit/docedit.component';
import {MatrixState} from './matrix-state';
import {IdaiFieldFeatureDocumentReadDatastore} from '../../core/datastore/field/idai-field-feature-document-read-datastore';
import {IdaiFieldFeatureDocument} from '../../core/model/idai-field-feature-document';
import {Loading} from '../../widgets/loading';
import {DotBuilder} from "./dot-builder";
import {ProjectConfiguration} from 'idai-components-2/core';


type LineType = 'straight' | 'curved';


@Component({
    moduleId: module.id,
    templateUrl: './matrix-view.html'
})
/**
 * Responsible for the calculation of the graph.
 *
 * @author Thomas Kleinke
 */
export class MatrixViewComponent implements OnInit {


    private trenches: IdaiFieldDocument[] = [];
    private selectedTrench: IdaiFieldDocument|undefined;
    private featureDocuments: IdaiFieldFeatureDocument[] = [];

    private subgraphSelection: IdaiFieldFeatureDocument[] = [];


    public graph: string;

    public selectionMode: 'edit' | 'subgraphSelect' = 'edit';
    public currentLineMode: LineType = 'curved';

    private groupMode = true; // true meaning things get grouped by period


    constructor(
        private datastore: IdaiFieldDocumentReadDatastore,
        private projectConfiguration: ProjectConfiguration,
        private featureDatastore: IdaiFieldFeatureDocumentReadDatastore,
        private modalService: NgbModal,
        private matrixState: MatrixState,
        private loading: Loading
    ) {}


    async ngOnInit() {

        await this.populateTrenches();
    }


    public getDocumentLabel = (document: any) => ModelUtil.getDocumentLabel(document);


    private noTrenches = () => this.trenches.length === 0;

    private noFeatures = () => this.featureDocuments.length === 0;

    public showGraph = () => !this.noTrenches() && !this.noFeatures();

    public showNoResourcesWarning = () => !this.noTrenches() && this.noFeatures() && !this.loading.isLoading();

    public showNoTrenchesWarning = () => this.noTrenches();

    public showTrenchSelector = () => !this.noTrenches();


    public selectLineMode(mode: LineType) {

        this.currentLineMode = mode;
        this.createGraph();
    };


    public currentLineModeIs(mode: LineType): boolean {

        return this.currentLineMode === mode;
    }


    public toggleGroupMode() {

        if (this.groupMode) {
            this.groupMode = false;
            this.createGraph();
        } else {
            this.groupMode = true;
            this.createGraph();
        }
    }


    public async select(resourceIdentifier: string) {

        const docToEdit = this.featureDocuments.find(_ =>
            _.resource.identifier === resourceIdentifier);

        if (!docToEdit) return;

        if (this.selectionMode === 'edit') {
            await this.launchDocedit(docToEdit);
        } else {
            if (!this.subgraphSelection // TODO use tsfun unique with a comparison function parameter, possible with sameOnPath('resource.identifier')
                .find(_ => _.resource.identifier === docToEdit.resource.identifier)) {
                    this.subgraphSelection.push(docToEdit);
                }
        }

    }


    public async launchDocedit(docToEdit: IdaiFieldFeatureDocument) {

        const doceditRef = this.modalService.open(DoceditComponent,
            { size: 'lg', backdrop: 'static', keyboard: false });
        doceditRef.componentInstance.setDocument(docToEdit);

        const reset = () => {
            this.featureDocuments = [];
            this.selectedTrench = undefined;
            this.populateTrenches()
        };

        await doceditRef.result
            .then(() => reset(),
                reason => {
                    if (reason === 'deleted') reset();
                });
    }


    public async subgraphActivateDeactivate() {

        if (this.selectionMode === 'edit') {
            if (this.selectedTrench) {
                await this.loadFeatureDocuments(this.selectedTrench);
            }
        } else {
            if (this.subgraphSelection.length > 0) {
                this.featureDocuments = this.subgraphSelection;
                this.subgraphSelection = [];
            }
            this.selectionMode = 'edit';
        }

        this.createGraph();
    }


    public toggleSubgraphSelection(): void {

        if (this.selectionMode === 'edit') {
            this.subgraphSelection = [];
            this.selectionMode = 'subgraphSelect';
        } else {
            this.selectionMode = 'edit';
        }
    }


    private createGraph(): void {

        const graph: string = DotBuilder.build(
            this.projectConfiguration,
            MatrixViewComponent.getPeriodMap(this.featureDocuments, this.groupMode),
            ['isAfter', 'isBefore', 'isContemporaryWith'],
            this.currentLineMode);

        this.graph = Viz(graph, { format: 'svg', engine: 'dot' }) as string;
    }


    private async populateTrenches(): Promise<void> {

        this.trenches = (await this.datastore.find({ types: ['Trench'] })).documents;
        if (this.trenches.length === 0) return;

        for (let trench of this.trenches) {
            if (this.matrixState.selectedTrenchId === trench.resource.id) return this.selectTrench(trench);
        }

        this.matrixState.selectedTrenchId = this.trenches[0].resource.id;
        await this.selectTrench(this.trenches[0]);
    }


    private static getPeriodMap(
        documents: Array<IdaiFieldFeatureDocument>,
        groupMode: boolean)
        : { [period: string]: Array<IdaiFieldFeatureDocument> } {

        if (!groupMode) {
            return {
                'UNKNOWN': documents
            };
        }

        return documents.reduce((periodMap: any, document: IdaiFieldFeatureDocument) => {
            const period: string = document.resource.hasPeriod
                || document.resource.hasPeriodBeginning // TODO Remove
                || 'UNKNOWN';
            if (!periodMap[period]) periodMap[period] = [];
            periodMap[period].push(document);
            return periodMap;
        }, {});
    }


    private async selectTrench(trench: IdaiFieldDocument) {

        if (trench == this.selectedTrench) return;

        this.selectedTrench = trench;
        this.matrixState.selectedTrenchId = this.selectedTrench.resource.id;
        this.featureDocuments = [];

        await this.loadFeatureDocuments(trench);
        this.createGraph();
    }


    private async loadFeatureDocuments(trench: IdaiFieldDocument) {

        this.loading.start();

        this.featureDocuments = (await this.featureDatastore.find( {
            constraints: { 'isRecordedIn:contain': trench.resource.id }
        })).documents;

        this.loading.stop();
    }
}