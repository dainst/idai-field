import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Document } from 'idai-field-core';

const moment = typeof window !== 'undefined' ? window.require('moment') : require('moment');



export type WinningSide = 'left'|'right'|'mixed';


/**
 * @author Thomas Kleinke
 */
 @Component({
    selector: 'revision-selector',
    templateUrl: './revision-selector.html'
})
export class RevisionSelectorComponent {

    @Input() document: Document;
    @Input() conflictedRevisions: Array<Document>;
    @Input() inspectedRevisions: Array<Document>;
    @Input() selectedRevision: Document|undefined;
    @Input() winningSide: WinningSide;

    @Output() onSelectWinningSide: EventEmitter<WinningSide> = new EventEmitter<WinningSide>();
    @Output() onSelectRevision: EventEmitter<Document> = new EventEmitter<Document>();

   
    public setWinningSide = (winningSide: WinningSide) => this.onSelectWinningSide.emit(winningSide);

    public setSelectedRevision = (revision: Document) => this.onSelectRevision.emit(revision);


    public getRevisionLabel(revision: Document): string {

        moment.locale('de');
        return Document.getLastModified(revision).user
            + ' - '
            + moment(Document.getLastModified(revision).date).format('DD. MMMM YYYY HH:mm:ss [Uhr]');
    }
}
