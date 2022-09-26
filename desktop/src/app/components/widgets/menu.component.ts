import { Renderer2 } from '@angular/core';
import { MenuContext } from '../../services/menu-context';
import { Menus } from '../../services/menus';
import { ComponentHelpers } from '../component-helpers';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export abstract class MenuComponent {

    public opened: boolean = false;

    private removeMouseEventListener: Function|undefined;


    constructor(private renderer: Renderer2,
                protected menuService: Menus,
                private buttonElementId: string,
                private menuElementsPrefix: string) {}


    public toggle() {

        if (this.opened) {
            this.close();
        } else {
            this.open();
        }
    }


    public open() {

        this.opened = true;

        this.removeMouseEventListener = this.renderer.listen(
            'document',
            'click',
            event => this.handleMouseEvent(event));
    }


    public close() {

        if (!this.isClosable()) return;

        this.opened = false;

        if (this.removeMouseEventListener) this.removeMouseEventListener();
    }


    private handleMouseEvent(event: any) {

        if (!this.isClosable()) return;

        if (!ComponentHelpers.isInside(event.target, target =>
               target.id && (target.id === this.buttonElementId || target.id.startsWith(this.menuElementsPrefix)))) {

            this.close();
        }
    }


    protected isClosable(): boolean {

        return this.menuService.getContext() !== MenuContext.MODAL;
    }
}
