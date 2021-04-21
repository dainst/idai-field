import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import * as tsfun from 'tsfun';
import {Document, ImageDocument} from 'idai-field-core';
import {FieldDocument} from 'idai-field-core';
import {DoceditComponent} from '../docedit/docedit.component';
import {RoutingService} from '../routing-service';
import {MenuContext, MenuService} from '../menu-service';
import {ImageRowItem} from '../../core/images/row/image-row';


/**
 * @author Thomas Kleinke
 */
export abstract class ViewModalComponent {

    public images: Array<ImageRowItem> = [];
    public selectedImage: ImageRowItem|undefined;


    constructor(protected activeModal: NgbActiveModal,
                private modalService: NgbModal,
                private routingService: RoutingService,
                private menuService: MenuService) {}

i;
    protected abstract getDocument(isImageDocument?: boolean): Document;

    protected abstract setDocument(document: Document, isImageDocument?: boolean): void;


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.MODAL) this.close();
    }


    public async onSelected(selectedImage: ImageRowItem) {

        this.selectedImage = selectedImage;
    }


    public close() {

        this.activeModal.close();
    }


    public async startEdit(isImageDocument?: boolean, activeGroup?: string) {

        this.menuService.setContext(MenuContext.DOCEDIT);

        const doceditModalRef = this.modalService.open(
            DoceditComponent,
            { size: 'lg', backdrop: 'static' }
        );
        const doceditModalComponent = doceditModalRef.componentInstance;
        doceditModalComponent.setDocument(this.getDocument(isImageDocument), isImageDocument);
        if (activeGroup) doceditModalComponent.activeGroup = activeGroup;

        try {
            const result = await doceditModalRef.result;
            if (result.document) this.setDocument(result.document, isImageDocument);
        } catch (closeReason) {
            // Cancelled
        }

        this.menuService.setContext(MenuContext.MODAL);
    }


    public async jumpToResource(documentToJumpTo: FieldDocument) {

        this.close();
        await this.routingService.jumpToResource(documentToJumpTo, true);
    }
}
