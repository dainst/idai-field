import {Injectable} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {FieldResource, ImageDocument} from 'idai-components-2';
import {MenuService} from '../../../desktop/menu-service';
import {ImageViewComponent} from '../../image/view/image-view.component';
import {ResourcesComponent} from '../resources.component';
import {ImageReadDatastore} from '../../../core/datastore/field/image-read-datastore';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class ImageModalLauncher {

    constructor(private modalService: NgbModal,
                private datastore: ImageReadDatastore) {}


    public async openImageModal(resource: FieldResource, resourcesComponent: ResourcesComponent) {

        MenuService.setContext('image-view');
        resourcesComponent.isModalOpened = true;

        const images: Array<ImageDocument> = await this.getImageDocuments(resource.relations.isDepictedIn);

        const modalRef: NgbModalRef = this.modalService.open(
            ImageViewComponent,
            { size: 'lg', backdrop: 'static', keyboard: false }
        );
        await modalRef.componentInstance.initialize(
            images,
            images[0],
            resource.identifier
        );
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

