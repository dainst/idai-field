import * as THREE from 'three';
import {Viewer3D} from '../../core/3d/viewer-3d';
import {Object3D} from '../../core/3d/object-3d';


/**
 * @author Thomas Kleinke
 */
export class Object3DViewerControls {
    
    private currentAction: string;  // drag, rotate, none

    private lastXPosition: number;
    private lastYPosition: number;

    private object: Object3D;

    private originalRotation: THREE.Quaternion;


    constructor(private viewer: Viewer3D) {}


    public getCurrentAction(): string {

        return this.currentAction;
    }


    public focusObject(object: Object3D) {

        this.object = object;
        this.originalRotation = object.mesh.quaternion.clone();

        const position: THREE.Vector3 = object.mesh.getWorldPosition();
        const camera: THREE.Camera = this.viewer.getCamera();

        camera.position.set(position.x, position.y + 6, position.z);
        camera.lookAt(position);
    }


    public onMouseDown(event: MouseEvent) {

        this.lastXPosition = event.clientX;
        this.lastYPosition = event.clientY;

        switch (event.which) {
            case 1:  // Left mouse button
                this.beginDragAction();
                break;

            case 3:  // Right mouse button
                this.beginRotateAction();
                break;
        }

        event.preventDefault();
    }


    public onMouseUp(event: MouseEvent) {

        this.resetAction();
    }


    public onMouseMove(event: MouseEvent) {

        const deltaX = this.lastXPosition - event.clientX;
        const deltaY = this.lastYPosition - event.clientY;

        this.performAction(deltaX, deltaY);

        this.lastXPosition = event.clientX;
        this.lastYPosition = event.clientY;
    }


    public onWheel(event: WheelEvent) {

        this.viewer.getCamera().translateZ(event.wheelDelta / 100);
    }


    private beginDragAction() {

        this.currentAction = 'drag';
    }


    private beginRotateAction() {

        this.currentAction = 'rotate';
    }


    private resetAction() {

        this.currentAction = 'none';
    }


    private performAction(deltaX: number, deltaY: number) {

        switch (this.currentAction) {
            case 'drag':
                this.drag(deltaX, deltaY);
                break;

            case 'rotate':
                this.rotate(deltaX, deltaY);
                break;
        }
    }


    private drag(deltaX: number, deltaY: number) {

        this.viewer.getCamera().translateX(deltaX / 100);
        this.viewer.getCamera().translateY(-deltaY / 100);
    }


    private rotate(deltaX: number, deltaY: number) {

        if (!this.object) return;

        this.object.mesh.rotation.x += deltaY / 100;
        this.object.mesh.rotation.y += deltaX / 100;
    }
}