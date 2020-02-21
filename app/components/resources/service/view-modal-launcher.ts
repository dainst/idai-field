import {Injectable} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Document, ImageDocument} from 'idai-components-2';
import {MenuService} from '../../../desktop/menu-service';
import {ImageViewComponent} from '../../viewmodal/image/image-view.component';
import {ResourcesComponent} from '../resources.component';
import {ImageReadDatastore} from '../../../core/datastore/field/image-read-datastore';
import {ResourceViewComponent} from '../../viewmodal/resource/resource-view.component';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class ViewModalLauncher {

    constructor(private modalService: NgbModal,
                private datastore: ImageReadDatastore) {}


    public async openImageViewModal(document: Document, resourcesComponent: ResourcesComponent) {

        MenuService.setContext('view-modal');
        resourcesComponent.isModalOpened = true;

        const images: Array<ImageDocument> = await this.getImageDocuments(
            document.resource.relations.isDepictedIn
        );

        const modalRef: NgbModalRef = this.modalService.open(
            ImageViewComponent,
            { size: 'lg', backdrop: 'static', keyboard: false }
        );
        await modalRef.componentInstance.initialize(
            images,
            images[0],
            document.resource.identifier
        );
        await modalRef.result;

        MenuService.setContext('default');
        resourcesComponent.isModalOpened = false;
    }


    public async openResourceViewModal(document: Document, resourcesComponent: ResourcesComponent) {

        MenuService.setContext('view-modal');
        resourcesComponent.isModalOpened = true;

        const modalRef: NgbModalRef = this.modalService.open(
            ResourceViewComponent,
            { size: 'lg', backdrop: 'static', keyboard: false }
        );
        await modalRef.componentInstance.initialize(document);
        await modalRef.result;

        MenuService.setContext('default');
        resourcesComponent.isModalOpened = false;
    }


    private async getImageDocuments(relations: string[]|undefined): Promise<Array<ImageDocument>> {

        return relations
            ? this.datastore.getMultiple(relations)
            : [];
    }
}

