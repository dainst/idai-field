import {DoCheck, ElementRef, ViewChild} from '@angular/core';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Messages, Document, FieldDocument} from 'idai-components-2';
import {DoceditComponent} from '../docedit/docedit.component';
import {RoutingService} from '../routing-service';
import {MenuService} from '../../desktop/menu-service';
import {ImageRowItem} from '../image/row/image-row.component';


/**
 * @author Thomas Kleinke
 */
export abstract class ViewModalComponent implements DoCheck {

    @ViewChild('resourceInfo', { static: false }) resourceInfo: ElementRef;

    public images: Array<ImageRowItem> = [];
    public selectedImage: ImageRowItem|undefined;
    public resourceInfoScrollbarVisible: boolean = false;

    private subModalOpened: boolean = false;


    constructor(private activeModal: NgbActiveModal,
                private messages: Messages,
                private modalService: NgbModal,
                private routingService: RoutingService) {}


    ngDoCheck() {

        this.resourceInfoScrollbarVisible = this.isResourceInfoScrollbarVisible();
    }


    public abstract toggleExpandAllGroups(isImageDocument?: boolean): void;

    public abstract getExpandAllGroups(isImageDocument?: boolean): boolean;

    public abstract getOpenSection(isImageDocument?: boolean): string|undefined;

    public abstract setOpenSection(section: string, isImageDocument?: boolean): void;

    protected abstract getDocument(isImageDocument?: boolean): Document;

    protected abstract setDocument(document: Document, isImageDocument?: boolean): void;


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && !this.subModalOpened) await this.activeModal.close();
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
            if (closeReason === 'deleted') await this.activeModal.close();
        }

        this.subModalOpened = false;
        MenuService.setContext('view-modal');
    }


    public async jumpToResource(documentToJumpTo: FieldDocument) {

        await this.routingService.jumpToResource(documentToJumpTo, true);
        this.activeModal.close();
    }


    private isResourceInfoScrollbarVisible(): boolean {

        return this.resourceInfo
            && this.resourceInfo.nativeElement.scrollHeight
            > this.resourceInfo.nativeElement.clientHeight;
    }
}
