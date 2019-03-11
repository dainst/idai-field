import {Component, Input, OnChanges} from '@angular/core';
import {FieldDefinition, RelationDefinition} from 'idai-components-2';
import {on, isnt, isNot, undefinedOrEmpty, is} from 'tsfun';
import {includedIn} from 'tsfun/src/comparator';

/**
 * @author Daniel de Oliveira
 */
@Component({
    moduleId: module.id,
    selector: 'time-form',
    templateUrl: './time-form.html'
})

export class TimeFormComponent implements OnChanges {

    @Input() document: any;
    @Input() primary: string;
    @Input() relationDefinitions: Array<RelationDefinition>;
    @Input() fieldDefinitions: Array<FieldDefinition>;

    public fieldsToShow: Array<FieldDefinition>;
    public relationDefinitionsToShow: Array<RelationDefinition> = [];

    ngOnChanges() {


        if (isNot(undefinedOrEmpty)(this.fieldDefinitions)) {
            this.fieldsToShow =
                this.fieldDefinitions.filter(on('group', is('time'))).concat(
                    this.fieldDefinitions.filter(on('name', is('period')))
                );
        }

        if (isNot(undefinedOrEmpty)(this.relationDefinitions)) {
            this.relationDefinitionsToShow = this.relationDefinitions
                .filter(on('name', isNot(includedIn(['includes', 'borders', 'cuts', 'isCutBy', 'isAbove', 'isBelow']))));
        }
    }
}


