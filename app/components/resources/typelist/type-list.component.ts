import {Component, Input} from '@angular/core';
import {FieldDocument} from 'idai-components-2';
import {BaseList} from '../base-list';
import {ResourcesComponent} from '../resources.component';
import {ViewFacade} from '../../../core/resources/view/view-facade';
import {Loading} from '../../widgets/loading';


@Component({
    selector: 'type-list',
    moduleId: module.id,
    templateUrl: './type-list.html',
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class TypeListComponent extends BaseList {

    @Input() documents: Array<FieldDocument>;

    constructor(resourcesComponent: ResourcesComponent,
                viewFacade: ViewFacade,
                loading: Loading) {

        super(resourcesComponent, viewFacade, loading);
    }
}