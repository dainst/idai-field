import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CategoryForm, Datastore, Field, FieldDocument, FieldsViewField, FieldsViewUtil, IdGenerator, Labels,
    ProjectConfiguration, Relation, Resource, Document } from 'idai-field-core';
import { Messages } from '../../../messages/messages';
import { DeleteQrCodeModalComponent } from './delete-qr-code-modal.component';
import { AngularUtility } from '../../../../angular/angular-utility';
import { M } from '../../../messages/m';
import { Menus } from '../../../../services/menus';
import { MenuContext } from '../../../../services/menu-context';
import { ProjectLabelProvider } from '../../../../services/project-label-provider';
import { QrCodeService } from '../../service/qr-code-service';
import { UtilTranslations } from '../../../../util/util-translations';
import { PrintSettingsModalComponent } from './print-settings/print-settings-modal.component';
import { PrintSettings } from './print-settings/print-settings';


const QRCode = require('qrcode');


type PrintedField = {
    label: string;
    contentLabel: string;
};


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

    @ViewChild('qrCodeCanvas', { static: false }) canvasElement: ElementRef;

    public document: FieldDocument;

    public category: CategoryForm;
    public printedFields: Array<PrintedField>;
    public printSettings: PrintSettings;
    public saving: boolean = false;

    private printStyleElement: HTMLElement;


    constructor(private activeModal: NgbActiveModal,
                private idGenerator: IdGenerator,
                private datastore: Datastore,
                private messages: Messages,
                private modalService: NgbModal,
                private menus: Menus,
                private labels: Labels,
                private projectConfiguration: ProjectConfiguration,
                private projectLabelProvider: ProjectLabelProvider,
                private qrCodeService: QrCodeService,
                private utilTranslations: UtilTranslations,
                private decimalPipe: DecimalPipe) {}


    public cancel = () => this.activeModal.close();

    public hasQrCode = () => this.document.resource.scanCode !== undefined;

    public getShortDescriptionLabel = () => Resource.getShortDescriptionLabel(
        this.document.resource, this.labels, this.projectConfiguration
    );


    async ngAfterViewInit() {
        
        if (this.hasQrCode()) this.renderCode();
        this.printSettings = await PrintSettings.load();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.QR_CODE_EDITOR) {
            this.cancel();
        }
    }


    public async initialize() {

        this.category = this.projectConfiguration.getCategory(this.document.resource.category);
        this.printedFields = await this.getPrintedFields();
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
            AngularUtility.blurActiveElement();
        }
    }


    public async printCode() {

        this.applyPrintSettings();

        const defaultTitle: string = document.title;
        document.title = this.projectLabelProvider.getProjectLabel() + ' ' + this.document.resource.identifier;

        window.print();

        document.title = defaultTitle;

        AngularUtility.blurActiveElement();
    }


    public async openPrintSettingsModal() {

        this.menus.setContext(MenuContext.PRINT_SETTINGS_MODAL);

        try {
            const modalRef: NgbModalRef = this.modalService.open(
                PrintSettingsModalComponent,
                { animation: false, backdrop: 'static', keyboard: false }
            );
            await modalRef.componentInstance.initialize();
            this.printSettings = await modalRef.result;
        } catch (err) {
            // Print settings modal has been cancelled
        } finally {
            this.menus.setContext(MenuContext.QR_CODE_EDITOR);
            AngularUtility.blurActiveElement();
        }
    }


    private applyPrintSettings() {

        if (!this.printStyleElement) {
            this.printStyleElement = document.createElement('style');
            document.head.appendChild(this.printStyleElement);
        }
        
        this.printStyleElement.innerHTML = PrintSettings.getPrintStyle(this.printSettings);       
    }


    private async getPrintedFields(): Promise<Array<PrintedField>> {

        const printedFields: Array<PrintedField> = [];

        for (let field of this.category.scanCodes.printedFields) {
            const relationTarget: Document|undefined = await this.getRelationTarget(field.name);
            const contentLabel: string = await this.getFieldContentLabel(field.name, relationTarget);
            if (contentLabel) {
                printedFields.push({
                    label: field.printLabel ? this.getFieldLabel(field.name, relationTarget) : '',
                    contentLabel
                });
            }
        }

        return printedFields;
    }


    private getFieldLabel(fieldName: string, relationTarget?: Document): string {

        switch (fieldName) {
            case 'isRecordedIn':
            case 'liesWithin':
                return relationTarget
                    ? this.labels.get(this.projectConfiguration.getCategory(relationTarget.resource.category))
                    : undefined;
            default:
                return this.labels.getFieldLabel(this.category, fieldName);
        }   
    }


    private async getFieldContentLabel(fieldName: string, relationTarget?: Document): Promise<string|undefined> {

        if (fieldName === Resource.CATEGORY) {
            return this.labels.get(this.category);
        } else if (['isRecordedIn', 'liesWithin'].includes(fieldName)) {
            return relationTarget?.resource.identifier;
        }

        const field: Field = CategoryForm.getField(this.category, fieldName);
        const fieldContent: any = this.document.resource[fieldName];
        const fieldsViewField: FieldsViewField = await FieldsViewUtil.makeField(
            field, fieldContent, this.document.resource, this.projectConfiguration, {}, this.labels, this.datastore
        );

        return FieldsViewUtil.getLabel(
            fieldsViewField,
            fieldContent,
            this.labels,
            (key: string) => this.utilTranslations.getTranslation(key),
            (value: number) => this.decimalPipe.transform(value)
        );
    }


    private async getRelationTarget(fieldName: string): Promise<Document|undefined> {

        if (!['isRecordedIn', 'liesWithin'].includes(fieldName)) return undefined;

        const relationTarget: string = fieldName === 'isRecordedIn'
            ? this.document.resource.relations[Relation.Hierarchy.RECORDEDIN]?.[0]
            : this.document.resource.relations[Relation.Hierarchy.LIESWITHIN]?.[0];
        
        return relationTarget
            ? this.datastore.get(relationTarget)
            : undefined;
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
