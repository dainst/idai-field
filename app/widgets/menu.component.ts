import {Renderer2} from '@angular/core';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export abstract class MenuComponent {

    public opened: boolean = false;

    private mouseEventListener: Function|undefined;


    constructor(private renderer: Renderer2,
                private buttonElementId: string,
                private menuElementId: string,
                private clickToOpen: boolean = false) {}


    public open() {

        this.opened = true;

        this.mouseEventListener = this.renderer.listen(
            'document',
            this.clickToOpen ? 'click' : 'mousemove',
            event => this.handleMouseEvent(event));
    }


    public close() {

        this.opened = false;

        if (this.mouseEventListener) this.mouseEventListener();
    }


    private handleMouseEvent(event: any) {

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