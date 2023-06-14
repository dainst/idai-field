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

    private menuContextsStack: Array<MenuContext> = [];


    constructor(private modalService: NgbModal,
                private menuService: Menus) {}


    public initialize = (menuContext: MenuContext) => this.menuContextsStack = [menuContext];


    /**
     * ```
     * const [modalReference, componentInstance] =
     *      this.modals.make<AddCategoryModalComponent>(AddCategoryModalComponent);
     * ```
     *
     * @param size 'lg' for large
     */
    public make<MC, R = any>(modalClass: any, menuContext: MenuContext, size?: string, customCssClass?: string /* TODO provide own options object, or large?: true*/) {

        this.menuService.setContext(menuContext);
        this.menuContextsStack.push(menuContext);

        const options: NgbModalOptions = {
            backdrop: 'static',
            keyboard: false,
            animation: false,
            centered: true
        }
        if (size) options.size = size;
        if (customCssClass) options.windowClass = customCssClass;

        const modalReference: NgbModalRef = this.modalService.open(
            modalClass,
            options
        );
        return [modalReference.result, modalReference.componentInstance] as [Promise<R>, MC];
    }


    public async awaitResult<R = any>(result: Promise<R>, onSuccess: (result: any) => void,
                                      onFinish: () => void) {

        let resultObject: any;

        try {
            resultObject = await result;
        } catch {
            // Modal has been canceled
        }

        if (resultObject) await onSuccess(resultObject);
        this.restorePreviousMenuContext();
        onFinish();
    }


    public async closeModal(componentInstance: any) {

        this.restorePreviousMenuContext();
        componentInstance.activeModal.close();
    }


    private restorePreviousMenuContext() {

        if (this.menuContextsStack.length > 1) this.menuContextsStack.pop();
        this.menuService.setContext(this.menuContextsStack[this.menuContextsStack.length - 1]);
    }
}
