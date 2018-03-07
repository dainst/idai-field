import {Component, OnInit} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiFieldDocumentReadDatastore} from '../../core/datastore/idai-field-document-read-datastore';
import {ModelUtil} from '../../core/model/model-util';


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


    constructor(private datastore: IdaiFieldDocumentReadDatastore) {}


    async ngOnInit() {

        await this.populateTrenches();
    }


    public getDocumentLabel = (document: any) => ModelUtil.getDocumentLabel(document);


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