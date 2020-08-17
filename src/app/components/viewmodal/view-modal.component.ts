import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Document, FieldDocument} from 'idai-components-2';
import {DoceditComponent} from '../docedit/docedit.component';
import {RoutingService} from '../routing-service';
import {MenuService} from '../menu-service';
import {Messages} from '../messages/messages';
import {ImageRowItem} from '../../core/images/row/image-row';


/**
 * @author Thomas Kleinke
 */
export abstract class ViewModalComponent {

    public images: Array<ImageRowItem> = [];
    public selectedImage: ImageRowItem|undefined;

    private subModalOpened: boolean = false;


    constructor(protected activeModal: NgbActiveModal,
                private messages: Messages,
                private modalService: NgbModal,
                private routingService: RoutingService) {}


    protected abstract getDocument(isImageDocument?: boolean): Document;

    protected abstract setDocument(document: Document, isImageDocument?: boolean): void;


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && !this.subModalOpened) this.close();
    }


    public async onSelected(selectedImage: ImageRowItem) {

        this.selectedImage = selectedImage;
    }


    public close() {

        this.activeModal.close();
    }


    public async startEdit(isImageDocument?: boolean) {

        this.subModalOpened = true;
        MenuService.setContext('docedit');

        const doceditModalRef = this.modalService.open(
            DoceditComponent,
            { size: 'lg', backdrop: 'static' }
        );
        const doceditModalComponent = doceditModalRef.componentInstance;
        doceditModalComponent.setDocument(this.getDocument(isImageDocument), isImageDocument);

        try {
            const result = await doceditModalRef.result;
            if (result.document) this.setDocument(result.document, isImageDocument);
        } catch (closeReason) {
            // Cancelled
        }

        this.subModalOpened = false;
        MenuService.setContext('modal');
    }


    public async jumpToResource(documentToJumpTo: FieldDocument) {

        this.close();
        await this.routingService.jumpToResource(documentToJumpTo, true);
    }
}
