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
import {GraphComponent} from "./graph.component";
import {DotBuilder} from "./dot-builder";
import {ProjectConfiguration} from 'idai-components-2/core';


@Component({
    moduleId: module.id,
    templateUrl: './matrix-view.html'
})
/**
 * @author Thomas Kleinke
 */
export class MatrixViewComponent implements OnInit {

    private trenches: Array<IdaiFieldDocument> = [];
    private selectedTrench: IdaiFieldDocument|undefined;
    private featureDocuments: Array<IdaiFieldFeatureDocument> = [];

    public graph: string;

    public currentLineMode: 'straight' | 'curved' = 'curved';

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


    public selectLineMode(mode: 'straight' | 'curved') {

        this.currentLineMode = mode;
        this.createGraph();
    };


    public currentLineModeIs(mode: 'straight' | 'curved'): boolean {

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


    public async select(event: string) {

        let selected;
        for (let doc of this.featureDocuments) {
            if (event === doc.resource.identifier) selected = doc;
        }
        if (!selected) return;

        const doceditRef = this.modalService.open(DoceditComponent,
            { size: 'lg', backdrop: 'static', keyboard: false });
        doceditRef.componentInstance.setDocument(selected);

        await doceditRef.result.then(
            res => {
                this.featureDocuments = [];
                this.selectedTrench = undefined;
                this.populateTrenches()
            },
            closeReason => {

                if (closeReason === 'deleted') {
                    this.featureDocuments = [];
                    this.selectedTrench = undefined;
                    this.populateTrenches();
                }
            }
        );
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

        if (this.trenches.length > 0) {

            for (let trench of this.trenches) {
                if (this.matrixState.selectedTrenchId === trench.resource.id) return this.selectTrench(trench);
            }

            this.matrixState.selectedTrenchId = this.trenches[0].resource.id;
            await this.selectTrench(this.trenches[0]);

        }
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