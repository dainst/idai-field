import { Component, EventEmitter, Input, Output } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { Document } from 'idai-field-core'
import { RevisionLabels } from '../../../services/revision-labels';


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


    constructor(private i18n: I18n) {}

   
    public setWinningSide = (winningSide: WinningSide) => this.onSelectWinningSide.emit(winningSide);

    public setSelectedRevision = (revision: Document) => this.onSelectRevision.emit(revision);

    public getRevisionLabel = (revision: Document) => RevisionLabels.getRevisionLabel(
        revision,
        this.i18n({ id: 'revisionLabel.timeSuffix', value: 'Uhr' })
    );
}
