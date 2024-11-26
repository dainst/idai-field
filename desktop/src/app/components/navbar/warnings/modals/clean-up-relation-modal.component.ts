import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { isEmpty } from 'tsfun';
import { Datastore, Document, WarningType } from 'idai-field-core';


@Component({
    templateUrl: './clean-up-relation-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class CleanUpRelationModalComponent {

    public document: Document;
    public relationName: string;
    public relationLabel: string|undefined;
    public invalidTargetIds: string[];
    public warningType: WarningType;


    constructor(public activeModal: NgbActiveModal,
                private datastore: Datastore) {}


    public cancel = () => this.activeModal.dismiss('cancel');


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public getRelationLabelHTML(): string {

        return this.relationLabel
            ? '<span><b>' + this.relationLabel + '</b> (<code>' + this.relationName + '</code>)</span>'
            : '<code>' + this.relationName + '</code>';
    }


    public async cleanUp() {

        const relations = this.document.resource.relations
        relations[this.relationName] = relations[this.relationName].filter(targetId => {
            return !this.invalidTargetIds.includes(targetId);
        });
        if (isEmpty(relations)) delete relations[this.relationName];

        await this.datastore.update(this.document);

        this.activeModal.close();
    }
}
