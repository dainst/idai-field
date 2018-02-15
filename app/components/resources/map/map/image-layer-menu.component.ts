import {Component} from '@angular/core';
import {ImageLayerManager} from './image-layer-manager';
import {LayerMenuComponent} from '../layer-menu.component';

@Component({
    moduleId: module.id,
    selector: 'image-layer-menu',
    templateUrl: './image-layer-menu.html'
})
/**
 * @author Thomas Kleinke
 */
export class ImageLayerMenuComponent extends LayerMenuComponent {

    constructor(layerManager: ImageLayerManager) {

        super(layerManager);
    }
}