import { ChangeDetectorRef } from '@angular/core';
import { ContextMenu } from './context-menu';

const remote = window.require('@electron/remote');
const mode = remote?.getGlobal('mode') ?? 'test';


/**
 * @author Thomas Kleinke
 */
export abstract class ContextMenuProvider {

    public contextMenu: ContextMenu;

    private listener: any;


    constructor(protected changeDetectorRef: ChangeDetectorRef) {

        if (mode === 'test') return;

        this.listener = this.closeContextMenu.bind(this);
        window.addEventListener('scroll', this.listener, true);
        window.addEventListener('resize', this.listener, true);
    }


    protected closeContextMenu() {

        if (!this.contextMenu) return;

        this.contextMenu.close();
        this.changeDetectorRef.detectChanges();
    }


    protected removeListeners() {

        if (mode === 'test') return;

        window.removeEventListener('scroll', this.listener, true);
        window.removeEventListener('resize', this.listener, true);
    }
}
