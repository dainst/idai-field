import {Component, Input} from '@angular/core';
import {RelationDefinition} from 'idai-components-2';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
@Component({
    moduleId: module.id,
    selector: 'relations-form',
    templateUrl: './relations-form.html'
})

export class RelationsFormComponent {

    @Input() document: any;
    @Input() primary: string;
    @Input() relationDefinitions: Array<RelationDefinition>;
}