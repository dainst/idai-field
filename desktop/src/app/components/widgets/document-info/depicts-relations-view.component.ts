import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Datastore, FieldDocument, ImageResource } from 'idai-field-core';


@Component({
    selector: 'depicts-relations-view',
    templateUrl: './depicts-relations-view.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class DepictsRelationsViewComponent implements OnChanges {

    @Input() resource: ImageResource;
    @Input() openSection: string|undefined;
    @Input() expandAllGroups: boolean;

    @Output() onSectionToggled: EventEmitter<string|undefined> = new EventEmitter<string|undefined>();
    @Output() onRelationClicked: EventEmitter<FieldDocument> = new EventEmitter<FieldDocument>();

    public relationTargets: Array<FieldDocument> = [];


    constructor(private datastore: Datastore) {}


    async ngOnChanges() {

        this.relationTargets = this.resource.relations.depicts
            ? (await this.datastore.getMultiple(this.resource.relations.depicts)) as Array<FieldDocument>
            : [];
    }


    public toggle() {

        if (this.openSection === 'depicts-relations' && !this.expandAllGroups) {
            this.openSection = undefined;
        } else {
            this.openSection = 'depicts-relations';
        }

        this.onSectionToggled.emit(this.openSection);
    }


    public async jumpToResource(document: FieldDocument) {

        this.onRelationClicked.emit(document);
    }
}
