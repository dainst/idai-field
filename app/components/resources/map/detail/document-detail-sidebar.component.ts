import {Component, ViewChild} from '@angular/core';
import {NgbTabset} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2/core';
import {ProjectConfiguration} from 'idai-components-2/core';
import {ResourcesComponent} from '../../resources.component';
import {ObjectUtil} from '../../../../util/object-util';
import {RoutingService} from '../../../routing-service';
import {ViewFacade} from '../../view/view-facade';


@Component({
    selector: 'document-view-sidebar',
    moduleId: module.id,
    templateUrl: './document-detail-sidebar.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class DocumentViewSidebarComponent {

    @ViewChild('tabs') tabs: NgbTabset;

    // for clean and refactor safe template, and to help find usages
    public jumpToRelationTarget = (documentToSelect: Document) => this.routingService.jumpToRelationTarget(
        documentToSelect, 'relations');


    public relationsToHide = ['liesWithin', 'isRecordedIn', 'includes'];


    constructor(
        public resourcesComponent: ResourcesComponent,
        private routingService: RoutingService,
        private projectConfiguration: ProjectConfiguration,
        private viewFacade: ViewFacade
    ) { }


    public onTabChange(event: any) {

        this.viewFacade.setActiveDocumentViewTab(event['nextId']
            .replace('document-view-', '')
            .replace('-tab', ''));
    }


    public hasVisibleRelations() {

        const selectedDoc = this.viewFacade.getSelectedDocument();
        if (!selectedDoc) return false;

        const relations: any = selectedDoc.resource.relations;
        if (ObjectUtil.isEmpty(relations)) return false;

        return Object.keys(relations).filter(name => {
            return this.projectConfiguration.isVisibleRelation(name, selectedDoc.resource.type)
                && this.relationsToHide.indexOf(name) === -1
                && relations[name].length > 0;
        }).length > 0;
    }
}