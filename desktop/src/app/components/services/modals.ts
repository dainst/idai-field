import { Injectable } from '@angular/core';
import { NgbModalOptions, NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MenuContext } from './menu-context';
import { Menus } from './menus';


@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class Modals {

    constructor(private modalService: NgbModal,
                private menuService: Menus) {}


    /**
     * ```
     * const [modalReference, componentInstance] =
     *      this.modals.make<AddCategoryModalComponent>(AddCategoryModalComponent);
     * ```
     *
     * @param size 'lg' for large
     */
    public make<MC, R = any>(modalClass: any, context: MenuContext, size?: string /* TODO provide own options object, or large?: true*/) {

        this.menuService.setContext(context);

        const options: NgbModalOptions = {
            backdrop: 'static',
            keyboard: false
        }
        if (size) options.size = size;

        const modalReference: NgbModalRef = this.modalService.open(
            modalClass,
            options
        );
        return [modalReference.result, modalReference.componentInstance] as [Promise<R>, MC];
    }


    public open(content: any, options?: NgbModalOptions): NgbModalRef {

        return this.modalService.open(content, options);
    }


    public setMenuContext(context: MenuContext) {

        this.menuService.setContext(context);
    }


    public resetMenuContext() {

        this.menuService.setContext(MenuContext.DEFAULT);
    }


    public getMenuContext() {

        return this.menuService.getContext();
    }
}
