import {Component, Input, ViewChild} from '@angular/core';
import {NgbTabset} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2/core';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {ResourcesComponent} from '../../resources.component';
import {ObjectUtil} from '../../../../util/object-util';
import {RoutingService} from '../../../routing-service';
import {ViewFacade} from '../../view/view-facade';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';


@Component({
    selector: 'document-view-sidebar',
    moduleId: module.id,
    templateUrl: './document-view-sidebar.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class DocumentViewSidebarComponent {

    @Input() updateThumbnails: boolean;

    @ViewChild('tabs') tabs: NgbTabset;

    // for clean and refactor safe template, and to help find usages
    public jumpToRelationTarget = (documentToSelect: Document) => this.routingService.jumpToRelationTarget(documentToSelect, 'relations');


    constructor(
        public resourcesComponent: ResourcesComponent,
        private routingService: RoutingService,
        private projectConfiguration: ProjectConfiguration,
        private viewFacade: ViewFacade
    ) { }


    public uploadImages(event: Event, document: IdaiFieldDocument) {

        this.updateThumbnails = false;
        this.resourcesComponent.uploadImages(event, document).then(() => this.updateThumbnails = true);
    }


    public onTabChange(event: any) {

        this.viewFacade.setActiveDocumentViewTab(event['nextId'].replace('document-view-', '').replace('-tab', ''));
    }


    public hasRelations() {

        const selectedDoc = this.viewFacade.getSelectedDocument();
        if (!selectedDoc) return false;

        const relations: any = selectedDoc.resource.relations;
        if (ObjectUtil.isEmpty(relations)) return false;

        for (let relation of Object.keys(relations)) {

            // invisible relations are not counted
            if (!this.projectConfiguration.isVisibleRelation(relation,selectedDoc.resource.type)) continue;

            // relations to project document are not counted
            if (relation == 'isRecordedIn' &&
                relations[relation].length == 1 &&
                relations[relation][0] == this.viewFacade.getProjectDocument().resource.id) continue;

            return true;
        }

        return false;
    }
}