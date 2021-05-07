import { Component, Input } from '@angular/core';
import { RelationDefinition } from 'idai-field-core';

@Component({
    selector: 'configuration-relation',
    templateUrl: './configuration-relation.html'
})
/**
* @author Sebastian Cuy 
* @author Thomas Kleinke
 */
export class ConfigurationRelationComponent {

    @Input() relation: RelationDefinition;


    constructor() {}
}
