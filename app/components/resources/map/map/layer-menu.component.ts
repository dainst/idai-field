import {Component, Input, Output, EventEmitter} from '@angular/core';
import {IdaiFieldImageDocument} from '../../../../core/model/idai-field-image-document';
import {LayerManager} from './layer-manager';

@Component({
    moduleId: module.id,
    selector: 'layer-menu',
    templateUrl: './layer-menu.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class LayerMenuComponent {

    @Input() layers: Array<IdaiFieldImageDocument> = [];

    @Output() onToggleLayer = new EventEmitter<IdaiFieldImageDocument>();
    @Output() onFocusLayer = new EventEmitter<IdaiFieldImageDocument>();

    public opened: boolean = false;


    constructor(private layerManager: LayerManager) {}


    public open = () => this.opened = true;
    public close = () => this.opened = false;
    public isOpened = (): boolean => this.opened;

    public isActiveLayer = (layer: IdaiFieldImageDocument) => this.layerManager.isActiveLayer(layer.resource.id as any);

    public toggleLayer = (layer: IdaiFieldImageDocument) => this.onToggleLayer.emit(layer);
    public focusLayer = (layer: IdaiFieldImageDocument) => this.onFocusLayer.emit(layer);


    // TODO remove this. check if ModelUtil.getDocumentLabel can be adjusted, the trimming should be done via css
    public getLayerLabel(layer: IdaiFieldImageDocument): string {

        let label = layer.resource.shortDescription && layer.resource.shortDescription != '' ?
            layer.resource.shortDescription :
            layer.resource.identifier;

        if (label.length > 48) label = label.substring(0, 45) + '...';

        return label;
    }
}