import {Input, Output, EventEmitter, Renderer2, Component} from '@angular/core';
import {LayerManager} from './layer-manager';
import {MenuComponent} from '../../../../widgets/menu.component';
import {IdaiFieldImageDocument} from 'idai-components-2';

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

    @Input() layers: Array<IdaiFieldImageDocument> = [];

    @Output() onToggleLayer = new EventEmitter<IdaiFieldImageDocument>();
    @Output() onFocusLayer = new EventEmitter<IdaiFieldImageDocument>();


    constructor(private layerManager: LayerManager,
                renderer: Renderer2) {

        super(renderer, 'layer-button', 'layer-menu');
    }


    public isActiveLayer = (layer: IdaiFieldImageDocument) => this.layerManager.isActiveLayer(layer.resource.id as any);
    public toggleLayer = (layer: IdaiFieldImageDocument) => this.onToggleLayer.emit(layer);
    public focusLayer = (layer: IdaiFieldImageDocument) => this.onFocusLayer.emit(layer);


    public getLayerLabel(layer: IdaiFieldImageDocument): string {

        let label = layer.resource.shortDescription && layer.resource.shortDescription != '' ?
            layer.resource.shortDescription :
            layer.resource.identifier;

        if (label.length > 48) label = label.substring(0, 45) + '...';

        return label;
    }
}