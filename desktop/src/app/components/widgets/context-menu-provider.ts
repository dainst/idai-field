import { ChangeDetectorRef } from '@angular/core';
import { ContextMenu } from './context-menu';


/**
 * @author Thomas Kleinke
 */
export abstract class ContextMenuProvider {

    public contextMenu: ContextMenu;

    private listener: any;


    constructor(protected changeDetectorRef: ChangeDetectorRef) {

        this.listener = this.closeContextMenu.bind(this);
        window.addEventListener('scroll', this.listener, true);
        window.addEventListener('resize', this.listener, true);
    }


    protected closeContextMenu() {

        this.contextMenu.close();
        this.changeDetectorRef.detectChanges();
    }


    protected removeListeners() {

        window.removeEventListener('scroll', this.listener, true);
        window.removeEventListener('resize', this.listener, true);
    }
}
