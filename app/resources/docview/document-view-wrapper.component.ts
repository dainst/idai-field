import {Component, Input} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {ProjectConfiguration} from 'idai-components-2/configuration'
import {ResourcesComponent} from '../resources.component';
import {ObjectUtil} from '../../util/object-util';
import {DocumentsManager} from '../service/documents-manager';
import {RoutingHelper} from '../service/routing-helper';

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
        private documentsManager: DocumentsManager,
        private routingHelper: RoutingHelper,
        private projectConfiguration: ProjectConfiguration
    ) { }


    public hasRelations() {

        const relations: any = this.documentsManager.selectedDocument.resource.relations;
        if (ObjectUtil.isEmpty(relations)) return false;

        for (let relation of Object.keys(relations)) {

            // invisible relations are not counted
            if (!this.projectConfiguration.isVisibleRelation(relation,this.documentsManager.selectedDocument.resource.type)) continue;

            // relations to project document are not counted
            if (relation == 'isRecordedIn' &&
                relations[relation].length == 1 &&
                relations[relation][0] == this.documentsManager.projectDocument.resource.id) continue;

            return true;
        }

        return false;
    }


    public jumpToRelationTarget(documentToSelect: Document) {

        this.routingHelper.jumpToRelationTarget(this.documentsManager.selected(), documentToSelect,
            docToSelect => this.documentsManager.setSelected(docToSelect), 'relations');
    }
}