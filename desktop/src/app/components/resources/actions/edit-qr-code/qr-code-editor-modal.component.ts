import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Datastore, FieldDocument, IdGenerator, Labels, ProjectConfiguration, Resource } from 'idai-field-core';
import { Messages } from '../../../messages/messages';
import { DeleteQrCodeModalComponent } from './delete-qr-code-modal.component';
import { AngularUtility } from '../../../../angular/angular-utility';
import { M } from '../../../messages/m';
import { Menus } from '../../../../services/menus';
import { MenuContext } from '../../../../services/menu-context';
import { ProjectLabelProvider } from '../../../../services/project-label-provider';
import { QrCodeService } from '../../service/qr-code-service';

const QRCode = require('qrcode');
const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


@Component({
    templateUrl: './qr-code-editor-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Danilo Guzzo
 * @author Thomas Kleinke
 */
export class QrCodeEditorModalComponent implements AfterViewInit {
   
    @Input() public document: FieldDocument;

    @ViewChild('qrCodeCanvas', { static: false }) canvasElement: ElementRef;

    public saving: boolean = false;


    constructor(private activeModal: NgbActiveModal,
                private idGenerator: IdGenerator,
                private datastore: Datastore,
                private messages: Messages,
                private modalService: NgbModal,
                private menus: Menus,
                private labels: Labels,
                private projectConfiguration: ProjectConfiguration,
                private projectLabelProvider: ProjectLabelProvider,
                private qrCodeService: QrCodeService) {}


    public cancel = () => this.activeModal.close();

    public hasQrCode = () => this.document.resource.scanCode !== undefined;

    public getShortDescriptionLabel = () => Resource.getShortDescriptionLabel(
        this.document.resource, this.labels, this.projectConfiguration
    );

    public getCategoryLabel = () => this.labels.get(this.projectConfiguration.getCategory(this.document));

    public getProjectLabel = () => this.projectLabelProvider.getProjectLabel();

    public getAppVersion = () => remote.app.getVersion();


    ngAfterViewInit() {
        
        if (this.hasQrCode()) this.renderCode();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.QR_CODE_EDITOR) {
            this.cancel();
        }
    }


    public async createNewCode() {

        if (await this.saveCode(this.idGenerator.generateId())) {
            this.messages.add([M.RESOURCES_SUCCESS_GENERATED_QR_CODE_SAVED]);
        }
    }


    public async setExistingCode() {

        const code: string = await this.qrCodeService.scanCode();
        if (!code) return;

        if (this.isUnassignedCode(code)) {
            if (await this.saveCode(code)) {
                this.messages.add([M.RESOURCES_SUCCESS_EXISTING_QR_CODE_SAVED]);
            }
        } else {
            this.messages.add([M.RESOURCES_ERROR_QR_CODE_ALREADY_ASSIGNED]);
        }
    }


    public async deleteCode() {

        this.menus.setContext(MenuContext.MODAL);

        try {
            const modalRef: NgbModalRef = this.modalService.open(
                DeleteQrCodeModalComponent,
                { animation: false, backdrop: 'static', keyboard: false }
            );
            modalRef.componentInstance.document = this.document;
            AngularUtility.blurActiveElement();

            if (!(await modalRef.result)) return;
            if (await this.saveCode(undefined)) {
                this.messages.add([M.RESOURCES_SUCCESS_QR_CODE_DELETED]);
            }
        } catch (err) {
            // Delete QR code modal has been cancelled
        } finally {
            this.menus.setContext(MenuContext.QR_CODE_EDITOR);
        }
    }


    public printCode() {

        const defaultTitle: string = document.title;
        document.title = this.getProjectLabel() + ' ' + this.document.resource.identifier;

        window.print();

        document.title = defaultTitle;
    }

    
    private renderCode() {

        QRCode.toCanvas(
            this.canvasElement.nativeElement, 
            this.document.resource.scanCode,
            {
                width: 240,
                margin: 0
            }
        );
    }


    private async saveCode(newCode?: string): Promise<boolean> {

        this.saving = true;

        if (newCode) {
            this.document.resource.scanCode = newCode;
        } else {
            delete this.document.resource.scanCode;
        }

        try {
            await this.datastore.update(this.document);
            if (newCode) this.renderCode();
            return true;
        } catch (errWithParams) {
            this.messages.add(errWithParams);
            return false;
        } finally {
            this.saving = false;
        }
    }


    private isUnassignedCode(code: string): boolean {

        return this.datastore.findIds({ constraints: { 'scanCode:match': code } }).totalCount === 0;
    }
}
