import {Component, Input, OnChanges} from '@angular/core';
import {FieldDefinition, RelationDefinition} from 'idai-components-2';
import {on, isnt, isNot, undefinedOrEmpty, is} from 'tsfun';
import {includedIn} from 'tsfun/src/comparator';

/**
 * @author Daniel de Oliveira
 */
@Component({
    moduleId: module.id,
    selector: 'space-form',
    templateUrl: './space-form.html'
})

export class SpaceFormComponent implements OnChanges {

    @Input() document: any;
    @Input() primary: string;
    @Input() relationDefinitions: Array<RelationDefinition>;
    @Input() fieldDefinitions: Array<FieldDefinition>;


    public fieldsToShow: Array<FieldDefinition> = [];
    public relationsToShow: Array<RelationDefinition> = [];

    ngOnChanges() {

        if (isNot(undefinedOrEmpty)(this.fieldDefinitions)) {
            this.fieldsToShow =
                this.fieldDefinitions.filter(on('group', is('space')))
        }

        if (isNot(undefinedOrEmpty)(this.relationDefinitions)) {
            this.relationsToShow = this.relationDefinitions
                .filter(on('name', isNot(includedIn(['isAfter', 'isBefore', 'isContemporaryWith']))));
        }
    }
}


