import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { flatten, to } from 'tsfun';
import { Category, FieldDefinition, RelationDefinition, ValuelistDefinition } from 'idai-field-core';
import { ValuelistUtil } from '../../core/util/valuelist-util';
import { OVERRIDE_VISIBLE_FIELDS } from './project-configuration.component';

const locale: string = typeof window !== 'undefined'
    ? window.require('@electron/remote').getGlobal('config').locale
    : 'de';


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
