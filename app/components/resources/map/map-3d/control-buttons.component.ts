import {Component} from '@angular/core';
import {Map3DComponent} from './map-3d.component';


@Component({
    moduleId: module.id,
    selector: 'control-buttons',
    templateUrl: './control-buttons.html'
})
/**
 * @author Thomas Kleinke
 */
export class ControlButtonsComponent {

    constructor(private map3DComponent: Map3DComponent) {}


    public turnClockwise() {

        this.map3DComponent.getControls().rotateCamera(true);
    }


    public turnCounterclockwise() {

        this.map3DComponent.getControls().rotateCamera(false);
    }
}