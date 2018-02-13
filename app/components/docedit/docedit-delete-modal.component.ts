import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2/core';


@Component({
    selector: 'docedit-delete-modal',
    moduleId: module.id,
    templateUrl: './docedit-delete-modal.html'
})
export class DoceditDeleteModalComponent {

    public document: any;

    public isRecordedInResourcesCount: number;

    constructor(public activeModal: NgbActiveModal) {}

    public setDocument = (document: Document) => this.document = document;

    public setCount = (count: number) => this.isRecordedInResourcesCount = count;
}