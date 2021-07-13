import { Injectable } from '@angular/core';
import { NgbModalOptions, NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';


@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class Modals {

    constructor(private modalService: NgbModal) {}


    /**
     * ```
     * const [modalReference, componentInstance] =
     *      this.modals.make<AddCategoryModalComponent>(AddCategoryModalComponent);
     * ```
     *
     * @param size 'lg' for large
     */
     public make<MC>(modalClass: any, size?: string) {

        const options: NgbModalOptions = {
            backdrop: 'static',
            keyboard: false
        }
        if (size) options.size = size;

        const modalReference: NgbModalRef = this.modalService.open(
            modalClass,
            options
        );
        return [modalReference, modalReference.componentInstance] as [NgbModalRef, MC]; // TODO maybe return only result promise on the lhs
    }


    public open(content: any, options?: NgbModalOptions): NgbModalRef {

        return this.modalService.open(content, options);
    }
}
