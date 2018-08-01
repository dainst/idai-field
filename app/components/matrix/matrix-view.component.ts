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
import {ObjectUtil} from "../../util/object-util";
import {isNot} from 'tsfun';


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

    public groupMode = true; // true meaning things get grouped by period
    public selectionMode = false; // false is edit mode, true is selection mode
    public curvedLineMode = true; // false is straight line mode


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


    public selectLineMode(curvedLineMode: boolean) {

        this.curvedLineMode = curvedLineMode;
        this.createGraph();
    };


    public toggleGroupMode() {

        this.groupMode = !this.groupMode;
        this.createGraph();
    }


    public async select(resourceIdentifier: string) {

        const docToEdit = this.featureDocuments.find(
            sameOnResourceIdentifier(resourceIdentifier));

        if (!docToEdit) return;
        if (!this.selectionMode) return this.launchDocedit(docToEdit);

        if (!this.subgraphSelection
            .find(sameOnResourceIdentifier(resourceIdentifier))) {

                this.subgraphSelection.push(docToEdit);
        } else {
            this.subgraphSelection = this.subgraphSelection
                .filter(isNot(sameOnResourceIdentifier(resourceIdentifier)));
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

        this.createGraph();
    }


    public toggleSubgraphSelection(): void {

        this.selectionMode = !this.selectionMode;
        if (this.selectionMode) this.subgraphSelection = [];
    }


    private createGraph(): void {

        const graph: string = DotBuilder.build(
            this.projectConfiguration,
            MatrixViewComponent.getPeriodMap(this.featureDocuments, this.groupMode),
            ['isAfter', 'isBefore', 'isContemporaryWith'],
            this.curvedLineMode);

        this.graph = Viz(graph, { format: 'svg', engine: 'dot' }) as string;
    }


    private async populateTrenches(): Promise<void> {

        this.trenches = (await this.datastore.find({ types: ['Trench'] })).documents;
        if (this.trenches.length === 0) return;

        const previouslySelectedTrench = this.trenches
            .find(sameOn('resource.id', this.matrixState.selectedTrenchId));
        if (previouslySelectedTrench) return this.selectTrench(previouslySelectedTrench);

        this.matrixState.selectedTrenchId = this.trenches[0].resource.id;
        await this.selectTrench(this.trenches[0]);
    }


    private static getPeriodMap(
        documents: Array<IdaiFieldFeatureDocument>,
        groupMode: boolean)
        : { [period: string]: Array<IdaiFieldFeatureDocument> } {

        if (!groupMode) return { 'UNKNOWN': documents };

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


// TODO move to tsfun / predicates
const sameOn = (path: string, comparison: any) =>
    (object: any): boolean =>
        ObjectUtil.getElForPathIn(object, path) === comparison;


const sameOnResourceIdentifier = (comparison: any) =>
    sameOn('resource.identifier', comparison);