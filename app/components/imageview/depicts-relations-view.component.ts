import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {ImageResource, FieldDocument} from 'idai-components-2';
import {FieldDatastore} from '../../core/datastore/field/field-datastore';


@Component({
    selector: 'depicts-relations-view',
    moduleId: module.id,
    templateUrl: './depicts-relations-view.html'
})
/**
 * @author Thomas Kleinke
 */
export class DepictsRelationsViewComponent implements OnChanges {

    @Input() resource: ImageResource;
    @Input() openSection: string|undefined;

    @Output() onSectionToggled: EventEmitter<string|undefined> = new EventEmitter<string|undefined>();
    @Output() onRelationClicked: EventEmitter<FieldDocument> = new EventEmitter<FieldDocument>();

    public relationTargets: Array<FieldDocument> = [];


    constructor(private datastore: FieldDatastore) {}


    async ngOnChanges() {

        this.relationTargets = await this.datastore.getMultiple(this.resource.relations.depicts);
    }


    public toggle() {

        if (this.openSection === 'depicts-relations') {
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