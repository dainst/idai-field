import {Component, Input} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2';
import {IdaiType, ProjectConfiguration} from 'idai-components-2';
import {ResourcesComponent} from '../resources.component';
import {Loading} from '../../../widgets/loading';
import {ViewFacade} from '../view/view-facade';
import {BaseList} from '../base-list';


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

    @Input() documents: Array<IdaiFieldDocument>;

    public typesMap: { [type: string]: IdaiType };


    constructor(
        resourcesComponent: ResourcesComponent,
        viewFacade: ViewFacade,
        loading: Loading,
        projectConfiguration: ProjectConfiguration
    ) {
        super(resourcesComponent, viewFacade, loading);
        this.typesMap = projectConfiguration.getTypesMap()
    }


    public async createNewDocument(doc: IdaiFieldDocument) {

        this.documents = this.documents
            .filter(_ => _.resource.id)
            .concat([doc]);
    }
}