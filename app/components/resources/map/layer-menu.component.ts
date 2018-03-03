import {Input, Output, EventEmitter, Renderer2} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {LayerManager} from './layer-manager';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export abstract class LayerMenuComponent {

    @Input() layers: Array<Document> = [];

    @Output() onToggleLayer = new EventEmitter<Document>();
    @Output() onFocusLayer = new EventEmitter<Document>();

    public opened: boolean = false;

    private removeMouseMoveEventListener: Function|undefined;


    constructor(private layerManager: LayerManager<Document>,
                private renderer: Renderer2,
                private buttonElementId: string,
                private menuElementId: string) {}


    public isActiveLayer = (layer: Document) => this.layerManager.isActiveLayer(layer.resource.id as any);

    public toggleLayer = (layer: Document) => this.onToggleLayer.emit(layer);
    public focusLayer = (layer: Document) => this.onFocusLayer.emit(layer);


    public open() {

        this.opened = true;

        this.removeMouseMoveEventListener = this.renderer.listen('document', 'mousemove',
            event => this.handleMouseMove(event));
    }


    public close() {

        this.opened = false;

        if (this.removeMouseMoveEventListener) this.removeMouseMoveEventListener();
    }


    public getLayerLabel(layer: Document): string {

        let label = layer.resource.shortDescription && layer.resource.shortDescription != '' ?
            layer.resource.shortDescription :
            layer.resource.identifier;

        if (label.length > 48) label = label.substring(0, 45) + '...';

        return label;
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