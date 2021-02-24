import {Renderer2} from '@angular/core';
import {MenuContext, MenuService} from '../menu-service';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export abstract class MenuComponent {

    public opened: boolean = false;

    private removeMouseEventListener: Function|undefined;


    constructor(private renderer: Renderer2,
                protected menuService: MenuService,
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

        let target = event.target;
        let inside = false;

        do {
            if (target.id && (target.id === this.buttonElementId || target.id.startsWith(this.menuElementsPrefix))) {
                inside = true;
                break;
            }
            target = target.parentNode;
        } while (target);

        if (!inside) this.close();
    }


    protected isClosable(): boolean {

        return this.menuService.getContext() !== MenuContext.MODAL;
    }
}
