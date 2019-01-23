import {Component, Input, OnChanges} from '@angular/core';
import {RelationDefinition} from 'idai-components-2';
import {on, isnt, isNot, undefinedOrEmpty} from 'tsfun';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
@Component({
    moduleId: module.id,
    selector: 'relations-form',
    templateUrl: './relations-form.html'
})

export class RelationsFormComponent implements OnChanges {

    @Input() document: any;
    @Input() primary: string;
    @Input() relationDefinitions: Array<RelationDefinition>;

    public relationDefinitionsToShow: Array<RelationDefinition> = [];

    ngOnChanges() {
        if (isNot(undefinedOrEmpty)(this.relationDefinitions)) {
            this.relationDefinitionsToShow = this.relationDefinitions.filter(on('name', isnt('includes')));
        }
    }
}


