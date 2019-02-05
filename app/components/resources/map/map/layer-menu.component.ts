import {Input, Output, EventEmitter, Renderer2, Component} from '@angular/core';
import {ImageDocument} from 'idai-components-2';
import {LayerManager} from './layer-manager';
import {MenuComponent} from '../../../../widgets/menu.component';

@Component({
    moduleId: module.id,
    selector: 'layer-menu',
    templateUrl: './layer-menu.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class LayerMenuComponent extends MenuComponent {

    @Input() layers: Array<ImageDocument> = [];

    @Output() onToggleLayer = new EventEmitter<ImageDocument>();
    @Output() onFocusLayer = new EventEmitter<ImageDocument>();


    constructor(private layerManager: LayerManager,
                renderer: Renderer2) {

        super(renderer, 'layer-button', 'layer-menu');
    }


    public isActiveLayer = (layer: ImageDocument) => this.layerManager.isActiveLayer(layer.resource.id as any);
    public toggleLayer = (layer: ImageDocument) => this.onToggleLayer.emit(layer);
    public focusLayer = (layer: ImageDocument) => this.onFocusLayer.emit(layer);


    public getLayerLabel(layer: ImageDocument): string {

        let label = layer.resource.shortDescription && layer.resource.shortDescription != '' ?
            layer.resource.shortDescription :
            layer.resource.identifier;

        if (label.length > 48) label = label.substring(0, 45) + '...';

        return label;
    }
}