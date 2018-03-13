import {Component, OnInit} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {IdaiFieldDocumentReadDatastore} from '../../core/datastore/idai-field-document-read-datastore';
import {ModelUtil} from '../../core/model/model-util';
import {DoceditLauncher} from '../resources/service/docedit-launcher';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {DoceditComponent} from '../docedit/docedit.component';


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
    private documents: Array<IdaiFieldDocument> = [];


    constructor(
        private datastore: IdaiFieldDocumentReadDatastore,
        private modalService: NgbModal
    ) {}


    async ngOnInit() {

        await this.populateTrenches();
    }


    public getDocumentLabel = (document: any) => ModelUtil.getDocumentLabel(document);


    public async select(event: string) {

        let selected;
        for (let doc of this.documents) {
            if (event === doc.resource.identifier) selected = doc;
        }
        if (!selected) return;

        const doceditRef = this.modalService.open(DoceditComponent,
            { size: 'lg', backdrop: 'static', keyboard: false });
        doceditRef.componentInstance.setDocument(selected);

        await doceditRef.result.then(
            res => {
                this.documents = [];
                this.selectedTrench = undefined;
                this.populateTrenches()
            },
            closeReason => {

                if (closeReason === 'deleted') {
                    this.documents = [];
                    this.selectedTrench = undefined;
                    this.populateTrenches();
                }
            }
        );
    }


    private async populateTrenches(): Promise<void> {


        this.trenches = (await this.datastore.find({ types: ['Trench'] })).documents;
        if (this.trenches.length > 0) await this.selectTrench(this.trenches[0]);
    }


    private async selectTrench(trench: IdaiFieldDocument) {

        if (trench == this.selectedTrench) return;

        this.selectedTrench = trench;

        this.documents = (await this.datastore.find( {
            constraints: { 'isRecordedIn:contain': this.selectedTrench.resource.id }
        })).documents;
    }
}