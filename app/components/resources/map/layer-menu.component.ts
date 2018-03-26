import {Input, Output, EventEmitter, Renderer2} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {LayerManager} from './layer-manager';
import {MenuComponent} from '../../../widgets/menu.component';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export abstract class LayerMenuComponent extends MenuComponent {

    @Input() layers: Array<Document> = [];

    @Output() onToggleLayer = new EventEmitter<Document>();
    @Output() onFocusLayer = new EventEmitter<Document>();


    constructor(private layerManager: LayerManager<Document>,
                renderer: Renderer2,
                buttonElementId: string,
                menuElementId: string) {

        super(renderer, buttonElementId, menuElementId);
    }


    public isActiveLayer = (layer: Document) => this.layerManager.isActiveLayer(layer.resource.id as any);

    public toggleLayer = (layer: Document) => this.onToggleLayer.emit(layer);
    public focusLayer = (layer: Document) => this.onFocusLayer.emit(layer);


    public getLayerLabel(layer: Document): string {

        let label = layer.resource.shortDescription && layer.resource.shortDescription != '' ?
            layer.resource.shortDescription :
            layer.resource.identifier;

        if (label.length > 48) label = label.substring(0, 45) + '...';

        return label;
    }
}