import {Component, Input} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiType, ProjectConfiguration} from 'idai-components-2/configuration';
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
 * A hierarchical view of resources
 *
 * @author Fabian Z.
 * @author Thomas Kleinke
 * @author Philipp Gerth
 */
export class ListComponent extends BaseList {

    @Input() ready: boolean;
    @Input() documents: IdaiFieldDocument[];

    public typesMap: { [type: string]: IdaiType };

    private newResourceCreated: boolean = false;


    constructor(
        resourcesComponent: ResourcesComponent,
        viewFacade: ViewFacade,
        loading: Loading,
        projectConfiguration: ProjectConfiguration
    ) {
        super(resourcesComponent, viewFacade, loading);
        this.typesMap = projectConfiguration.getTypesMap()
    }


    public async createNewDocument(newDoc: IdaiFieldDocument) {

        const docs: Array<IdaiFieldDocument> = this.viewFacade.getDocuments() as IdaiFieldDocument[];
        
        for (let doc of this.documents) {
            if (!doc.resource.id) {
                this.documents.splice(docs.indexOf(doc),1);
                break;
            }
        }

        this.documents.push(newDoc);
        this.newResourceCreated = true;
    }

}