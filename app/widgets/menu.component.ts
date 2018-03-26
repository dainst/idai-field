import {Renderer2} from '@angular/core';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export abstract class MenuComponent {

    public opened: boolean = false;

    private removeMouseMoveEventListener: Function|undefined;


    constructor(private renderer: Renderer2,
                private buttonElementId: string,
                private menuElementId: string) {}


    public open() {

        this.opened = true;

        this.removeMouseMoveEventListener = this.renderer.listen('document', 'mousemove',
            event => this.handleMouseMove(event));
    }


    public close() {

        this.opened = false;

        if (this.removeMouseMoveEventListener) this.removeMouseMoveEventListener();
    }


    private handleMouseMove(event: any) {

        let target = event.target;
        let inside = false;

        do {
            if (target.id == this.buttonElementId || target.id == this.menuElementId) {
                inside = true;
                break;
            }
            target = target.parentNode;
        } while (target);

        if (!inside) this.close();
    }
}