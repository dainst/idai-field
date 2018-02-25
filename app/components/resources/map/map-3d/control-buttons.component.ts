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

    public compassRotationDegrees: number = 0;


    constructor(private map3DComponent: Map3DComponent) {}


    public turnClockwise() {

        if (!this.map3DComponent.getControls().isCameraRotationAllowed()) return;

        this.map3DComponent.getControls().rotateCamera(true);
        this.compassRotationDegrees += 90;
    }


    public turnCounterclockwise() {

        if (!this.map3DComponent.getControls().isCameraRotationAllowed()) return;

        this.map3DComponent.getControls().rotateCamera(false);
        this.compassRotationDegrees -= 90;
    }
}