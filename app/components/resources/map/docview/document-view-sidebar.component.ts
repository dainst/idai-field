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
import {ImageUploader} from '../../../../upload/image/image-uploader';
import {M} from '../../../../m';
import {Object3DUploader} from '../../../../upload/object3d/object-3d-uploader';


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
        private imageUploader: ImageUploader,
        private object3DUploader: Object3DUploader,
        private messages: Messages
    ) { }


    public uploadImages(event: Event, document: IdaiFieldDocument) {

        this.imageUploader.startUpload(event, document).then(uploadResult => {

            if (uploadResult.uploadedFiles > 0) {
                this.viewFacade.setActiveDocumentViewTab('images');
                this.viewFacade.setSelectedDocument(document);
            }

            for (let msgWithParams of uploadResult.messages) {
                this.messages.add(msgWithParams);
            }

            if (uploadResult.uploadedFiles == 1) {
                this.messages.add([M.RESOURCES_SUCCESS_IMAGE_UPLOADED, document.resource.identifier]);
            } else if (uploadResult.uploadedFiles > 1) {
                this.messages.add([M.RESOURCES_SUCCESS_IMAGES_UPLOADED, uploadResult.uploadedFiles.toString(),
                    document.resource.identifier]);
            }
        });
    }


    public upload3DObjects(event: Event, document: IdaiFieldDocument) {

        this.object3DUploader.startUpload(event, document).then(uploadResult => {

            if (uploadResult.uploadedFiles > 0) {
                this.viewFacade.setActiveDocumentViewTab('3d-objects');
                this.viewFacade.setSelectedDocument(document);
            }

            for (let msgWithParams of uploadResult.messages) {
                this.messages.add(msgWithParams);
            }

            if (uploadResult.uploadedFiles == 1) {
                this.messages.add([M.RESOURCES_SUCCESS_3D_OBJECT_UPLOADED, document.resource.identifier]);
            } else if (uploadResult.uploadedFiles > 1) {
                this.messages.add([M.RESOURCES_SUCCESS_3D_OBJECTS_UPLOADED,
                    uploadResult.uploadedFiles.toString(), document.resource.identifier]);
            }
        });
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