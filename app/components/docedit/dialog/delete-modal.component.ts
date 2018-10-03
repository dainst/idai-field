import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2';


@Component({
    selector: 'delete-modal',
    moduleId: module.id,
    templateUrl: './delete-modal.html'
})
export class DeleteModalComponent {

    public document: any;

    public isRecordedInResourcesCount: number;

    constructor(public activeModal: NgbActiveModal) {}

    public setDocument = (document: Document) => this.document = document;

    public setCount = (count: number) => this.isRecordedInResourcesCount = count;
}