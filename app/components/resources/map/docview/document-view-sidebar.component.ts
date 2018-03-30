import {Component, Input, ViewChild} from '@angular/core';
import {NgbTabset} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {Messages} from 'idai-components-2/messages';
import {ResourcesComponent} from '../../resources.component';
import {ObjectUtil} from '../../../../util/object-util';
import {RoutingService} from '../../../routing-service';
import {ViewFacade} from '../../view/view-facade';
import {M} from '../../../../m';
import {UploadService} from '../../../../upload/upload-service';
import {UploadResult} from '../../../../upload/upload-result';


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

    @Input() showGeometryEditingOptions: boolean;

    @ViewChild('tabs') tabs: NgbTabset;

    // for clean and refactor safe template, and to help find usages
    public jumpToRelationTarget = (documentToSelect: Document) => this.routingService.jumpToRelationTarget(
        documentToSelect, 'relations');


    constructor(
        public resourcesComponent: ResourcesComponent,
        private routingService: RoutingService,
        private projectConfiguration: ProjectConfiguration,
        private viewFacade: ViewFacade,
        private uploadService: UploadService,
        private messages: Messages
    ) { }


    public async uploadMediaFiles(event: Event, document: IdaiFieldDocument) {

        const uploadResult: UploadResult = await this.uploadService.startUpload(event, document);

        if (uploadResult.uploadedFiles > 0) {
            this.viewFacade.setActiveDocumentViewTab('media');
            await this.viewFacade.setSelectedDocument(document);
        }

        for (let msgWithParams of uploadResult.messages) {
            this.messages.add(msgWithParams);
        }

        if (uploadResult.uploadedFiles == 1) {
            this.messages.add([M.RESOURCES_SUCCESS_FILE_UPLOADED, document.resource.identifier]);
        } else if (uploadResult.uploadedFiles > 1) {
            this.messages.add([M.RESOURCES_SUCCESS_FILES_UPLOADED, uploadResult.uploadedFiles.toString(),
                document.resource.identifier]);
        }
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