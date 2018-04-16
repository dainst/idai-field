import {Component, Output, EventEmitter} from '@angular/core';
import {Map3DComponent} from './map-3d.component';
import {ProjectionMode} from './map-3d-camera-manager';


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


    public getCameraProjectionMode = () => this.map3DComponent.getCameraManager().getProjectionMode();
    public isDefaultAngle = () => this.map3DComponent.getCameraManager().isDefaultAngle();


    public turnClockwise() {

        if (this.map3DComponent.getCameraManager().isAnimationRunning()) return;

        this.map3DComponent.getCameraManager().rotateBy90Degrees(true);
        this.compassRotationDegrees += 90;
    }


    public turnCounterclockwise() {

        if (this.map3DComponent.getCameraManager().isAnimationRunning()) return;

        this.map3DComponent.getCameraManager().rotateBy90Degrees(false);
        this.compassRotationDegrees -= 90;
    }


    public changeCameraProjectionMode() {

        if (this.map3DComponent.getCameraManager().isAnimationRunning()) return;

        const currentMode: ProjectionMode = this.map3DComponent.getCameraManager().getProjectionMode();
        const newMode: ProjectionMode = currentMode == 'perspective' ? 'orthographic' : 'perspective';

        this.map3DComponent.getCameraManager().setProjectionMode(newMode);
        this.onCameraModeChanged.emit();
    }


    public resetCameraAngle() {

        this.map3DComponent.getCameraManager().setDefaultAngle();
        this.onCameraModeChanged.emit();
    }
}