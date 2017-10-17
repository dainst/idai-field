import {Component, Input} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {ResourcesComponent} from '../resources.component';
import {ObjectUtil} from '../../util/object-util';
import {RoutingHelper} from '../service/routing-helper';
import {ViewFacade} from '../service/view-facade';

@Component({
    selector: 'document-view-wrapper',
    moduleId: module.id,
    templateUrl: './document-view-wrapper.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class DocumentViewWrapperComponent {

    @Input() activeTab;


    constructor(
        public resourcesComponent: ResourcesComponent,
        private routingHelper: RoutingHelper,
        private projectConfiguration: ProjectConfiguration,
        private viewFacade: ViewFacade
    ) { }


    public hasRelations() {

        const relations: any = this.viewFacade.getSelectedDocument().resource.relations;
        if (ObjectUtil.isEmpty(relations)) return false;

        for (let relation of Object.keys(relations)) {

            // invisible relations are not counted
            if (!this.projectConfiguration.isVisibleRelation(relation,this.viewFacade.getSelectedDocument().resource.type)) continue;

            // relations to project document are not counted
            if (relation == 'isRecordedIn' &&
                relations[relation].length == 1 &&
                relations[relation][0] == this.viewFacade.getProjectDocument().resource.id) continue;

            return true;
        }

        return false;
    }


    public jumpToRelationTarget(documentToSelect: Document) {

        this.routingHelper.jumpToRelationTarget(this.viewFacade.getSelectedDocument(), documentToSelect,
            docToSelect => this.viewFacade.setSelectedDocument(docToSelect), 'relations');
    }
}