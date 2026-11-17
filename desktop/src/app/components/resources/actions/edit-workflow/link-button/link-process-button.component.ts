import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Menus } from '../../../../../services/menus';
import { CategoryForm, FieldDocument, ProcessDocument } from 'idai-field-core';
import { MenuContext } from '../../../../../services/menu-context';
import { LinkProcessModalComponent } from './link-process-modal.component';
import { AngularUtility } from '../../../../../angular/angular-utility';


@Component({
    selector: 'link-process-button',
    templateUrl: './link-process-button.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class LinkProcessButtonComponent {

    @Input() baseDocuments: Array<FieldDocument>;
    @Input() allowedProcessCategories: Array<CategoryForm>;

    @Output() onProcessSelected: EventEmitter<ProcessDocument> = new EventEmitter<ProcessDocument>();


    constructor(private menus: Menus,
                private modalService: NgbModal) {}


    public async openModal() {

        try {
            this.menus.setContext(MenuContext.MODAL);

            const modalRef: NgbModalRef = this.modalService.open(
                LinkProcessModalComponent,
                { animation: false, backdrop: 'static', keyboard: false }
            );
            modalRef.componentInstance.baseDocuments = this.baseDocuments;
            modalRef.componentInstance.allowedProcessCategories = this.allowedProcessCategories;
            await modalRef.componentInstance.initialize();
            AngularUtility.blurActiveElement();
            const selectedProcess: ProcessDocument = await modalRef.result;
            this.onProcessSelected.emit(selectedProcess);
        } catch (err) {
            if (err !== 'cancel') console.error(err);
        } finally {
            this.menus.setContext(MenuContext.WORKFLOW_EDITOR);
        }
    }
}
