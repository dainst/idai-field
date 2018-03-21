import {Component, Output, EventEmitter} from '@angular/core';
import {Map3DComponent} from './map-3d.component';
import {CameraMode} from '../../../../core/3d/map-3d-camera-manager';


@Component({
    moduleId: module.id,
    selector: 'control-buttons',
    templateUrl: './control-buttons.html'
})
/**
 * @author Thomas Kleinke
 */
export class ControlButtonsComponent {

    @Output() onCameraModeChanged: EventEmitter<void> = new EventEmitter<void>();

    public compassRotationDegrees: number = 0;


    constructor(private map3DComponent: Map3DComponent) {}


    public getCameraMode = () => this.map3DComponent.getCameraManager().getMode();


    public turnClockwise() {

        if (!this.map3DComponent.getControls().isCameraAnimationAllowed()) return;

        this.map3DComponent.getControls().rotateCamera(true);
        this.compassRotationDegrees += 90;
    }


    public turnCounterclockwise() {

        if (!this.map3DComponent.getControls().isCameraAnimationAllowed()) return;

        this.map3DComponent.getControls().rotateCamera(false);
        this.compassRotationDegrees -= 90;
    }


    public changeCameraMode() {

        const currentMode: CameraMode = this.map3DComponent.getCameraManager().getMode();
        const newMode: CameraMode = currentMode == 'perspective' ? 'orthographic' : 'perspective';

        this.map3DComponent.getCameraManager().setMode(newMode);
        this.onCameraModeChanged.emit();
    }
}