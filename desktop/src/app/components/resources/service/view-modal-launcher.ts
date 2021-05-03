import {Injectable} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-field-core';
import {MenuContext, MenuService} from '../../menu-service';
import {ImageViewModalComponent} from '../../viewmodal/image/image-view-modal.component';
import {ResourceViewModalComponent} from '../../viewmodal/resource/resource-view-modal.component';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class ViewModalLauncher {

    constructor(private modalService: NgbModal,
                private menuService: MenuService) {}


    public async openImageViewModal(document: Document) {

        this.menuService.setContext(MenuContext.MODAL);

        const modalRef: NgbModalRef = this.modalService.open(
            ImageViewModalComponent,
            { size: 'lg', backdrop: 'static', keyboard: false }
        );
        await modalRef.componentInstance.initialize(
            undefined,
            undefined,
            document
        );
        await modalRef.result;

        this.menuService.setContext(MenuContext.DEFAULT);
    }


    /**
     * Returns true if the document has been edited via the resource view modal, otherwise false
     */
    public async openResourceViewModal(document: Document): Promise<boolean> {

        this.menuService.setContext(MenuContext.MODAL);

        const modalRef: NgbModalRef = this.modalService.open(
            ResourceViewModalComponent,
            { size: 'lg', backdrop: 'static', keyboard: false }
        );
        await modalRef.componentInstance.initialize(document);
        const edited: boolean = await modalRef.result;

        this.menuService.setContext(MenuContext.DEFAULT);

        return edited;
    }
}

