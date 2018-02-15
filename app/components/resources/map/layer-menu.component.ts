import {Input, Output, EventEmitter} from '@angular/core';
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


    constructor(private layerManager: LayerManager<Document>) {}


    public open = () => this.opened = true;
    public close = () => this.opened = false;
    public isOpened = (): boolean => this.opened;

    public isActiveLayer = (layer: Document) => this.layerManager.isActiveLayer(layer.resource.id as any);

    public toggleLayer = (layer: Document) => this.onToggleLayer.emit(layer);
    public focusLayer = (layer: Document) => this.onFocusLayer.emit(layer);


    // TODO remove this. check if ModelUtil.getDocumentLabel can be adjusted, the trimming should be done via css
    public getLayerLabel(layer: Document): string {

        let label = layer.resource.shortDescription && layer.resource.shortDescription != '' ?
            layer.resource.shortDescription :
            layer.resource.identifier;

        if (label.length > 48) label = label.substring(0, 45) + '...';

        return label;
    }
}