import {Component, Input} from '@angular/core';
import {FieldDocument} from 'idai-components-2/src/model/field-document';

@Component({
    selector: 'resources-types',
    moduleId: module.id,
    templateUrl: './resources-types.html',
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ResourcesTypesComponent {

    @Input() documents: Array<FieldDocument>;


}