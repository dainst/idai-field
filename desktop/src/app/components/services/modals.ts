import { Injectable } from '@angular/core';
import { NgbModalOptions, NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MenuContext } from './menu-context';
import { Menus } from './menus';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class Modals {

    private menuContexts: Array<MenuContext> = [];


    constructor(private modalService: NgbModal,
                private menuService: Menus) {}


    public initialize = (menuContext: MenuContext) => this.menuContexts = [menuContext];


    /**
     * ```
     * const [modalReference, componentInstance] =
     *      this.modals.make<AddCategoryModalComponent>(AddCategoryModalComponent);
     * ```
     *
     * @param size 'lg' for large
     */
    public make<MC, R = any>(modalClass: any, menuContext: MenuContext, size?: string /* TODO provide own options object, or large?: true*/) {

        this.menuService.setContext(menuContext);
        this.menuContexts.push(menuContext);

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


    public async awaitResult<R = any>(result: Promise<R>, onSuccess: (result: any) => void,
                                      onFinish: () => void) {

        try {
            await onSuccess(await result);
        } catch {
            // Modal has been canceled
        } finally {
            this.restorePreviousMenuContext();
            onFinish();
        }
    }


    public async closeModal(componentInstance: any) {
        
        this.restorePreviousMenuContext();
        componentInstance.activeModal.close();
    }


    private restorePreviousMenuContext() {

        if (this.menuContexts.length > 1) this.menuContexts.pop();
        this.menuService.setContext(this.menuContexts[this.menuContexts.length - 1]);
    }
}
