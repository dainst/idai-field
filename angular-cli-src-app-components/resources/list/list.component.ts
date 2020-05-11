import {Component, Input} from '@angular/core';
import {FieldDocument} from 'idai-components-2';
import {ResourcesComponent} from '../resources.component';
import {Loading} from '../../widgets/loading';
import {BaseList} from '../base-list';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {Category} from '../../../core/configuration/model/category';
import {ViewFacade} from '../../../core/resources/view/view-facade';


@Component({
    selector: 'list',
    moduleId: module.id,
    templateUrl: './list.html'
})
/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 * @author Philipp Gerth
 */
export class ListComponent extends BaseList {

    @Input() documents: Array<FieldDocument>;

    public categoriesMap: { [category: string]: Category };


    constructor(resourcesComponent: ResourcesComponent,
                viewFacade: ViewFacade,
                loading: Loading,
                projectConfiguration: ProjectConfiguration) {

        super(resourcesComponent, viewFacade, loading);
        this.categoriesMap = projectConfiguration.getCategoriesMap()
    }


    public async createNewDocument(doc: FieldDocument) {

        this.documents = this.documents
            .filter(_ => _.resource.id)
            .concat([doc]);
    }
}