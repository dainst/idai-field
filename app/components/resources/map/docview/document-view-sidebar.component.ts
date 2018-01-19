import {Component, ViewChild} from '@angular/core';
import {NgbTabset} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {Messages} from 'idai-components-2/messages';
import {ResourcesComponent} from '../../resources.component';
import {ObjectUtil} from '../../../../util/object-util';
import {RoutingService} from '../../../routing-service';
import {ViewFacade} from '../../state/view-facade';
import {ImageUploader} from '../../../imageupload/image-uploader';
import {M} from '../../../../m';


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

    @ViewChild('tabs') tabs: NgbTabset;

    // for clean and refactor safe template, and to help find usages
    public jumpToRelationTarget = (documentToSelect: Document) => this.routingService.jumpToRelationTarget(
        documentToSelect, 'relations');


    public relationsToHide = ['liesWithin', 'isRecordedIn', 'includes'];


    constructor(
        public resourcesComponent: ResourcesComponent,
        private routingService: RoutingService,
        private projectConfiguration: ProjectConfiguration,
        private viewFacade: ViewFacade,
        private imageUploader: ImageUploader,
        private messages: Messages
    ) { }


    public async uploadImages(event: Event, document: IdaiFieldDocument) {

        const uploadResult = await this.imageUploader.startUpload(event, document);

        if (uploadResult.uploadedImages > 0) {
            this.viewFacade.setActiveDocumentViewTab('images');
            this.viewFacade.setSelectedDocument(document);
        }

        for (let msgWithParams of uploadResult.messages) {
            this.messages.add(msgWithParams);
        }

        if (uploadResult.uploadedImages == 1) {
            this.messages.add([M.RESOURCES_SUCCESS_IMAGE_UPLOADED, document.resource.identifier]);
        } else if (uploadResult.uploadedImages > 1) {
            this.messages.add([M.RESOURCES_SUCCESS_IMAGES_UPLOADED, uploadResult.uploadedImages.toString(),
                document.resource.identifier]);
        }
    }


    public onTabChange(event: any) {

        this.viewFacade.setActiveDocumentViewTab(event['nextId'].replace('document-view-', '').replace('-tab', ''));
    }


    public hasVisibleRelations() {

        const selectedDoc = this.viewFacade.getSelectedDocument();
        if (!selectedDoc) return false;

        const relations: any = selectedDoc.resource.relations;
        if (ObjectUtil.isEmpty(relations)) return false;

        return (Object.keys(relations)
            .filter(name => this.projectConfiguration.isVisibleRelation(name, selectedDoc.resource.type))
            .filter(name => this.relationsToHide.indexOf(name) === -1))
            .length > 0;
    }
}