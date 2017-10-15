import {Component, Input} from '@angular/core';
import {ResourcesComponent} from '../resources.component';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ObjectUtil} from '../../util/object-util';
import {ProjectConfiguration} from 'idai-components-2/configuration'
import {DocumentsManager} from '../service/documents-manager';
import {RoutingHelper} from "../service/routing-helper";
import {Document} from 'idai-components-2/core';

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
    @Input() isEditing: boolean = false;

    constructor(
        public resourcesComponent: ResourcesComponent,
        private projectConfiguration: ProjectConfiguration,
        private documentsManager: DocumentsManager,
        private routingHelper: RoutingHelper
    ) { }


    public jumpToRelationTarget(documentToSelect: Document, tab?: string) {

        if (documentToSelect !=
                this.documentsManager.selectedDocument) {
            this.resourcesComponent.editGeometry = false;
        }

        this.routingHelper.jumpToRelationTarget(documentToSelect, tab);
    }


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
}