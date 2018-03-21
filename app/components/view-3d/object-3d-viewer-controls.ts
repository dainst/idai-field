import * as THREE from 'three';
import {Object3DViewerCameraManager} from './object-3d-viewer-camera-manager';


export type Object3DViewerAction = 'drag'|'rotate'|'none';


/**
 * @author Thomas Kleinke
 */
export class Object3DViewerControls {
    
    private currentAction: Object3DViewerAction;

    private lastXPosition: number;
    private lastYPosition: number;

    private mesh: THREE.Mesh;

    private originalRotation: THREE.Quaternion;


    constructor(private cameraManager: Object3DViewerCameraManager) {}


    public getCurrentAction(): Object3DViewerAction {

        return this.currentAction;
    }


    public setMesh(mesh: THREE.Mesh) {

        this.mesh = mesh;
        this.mesh.position.set(0, 0, 0);
        this.originalRotation = mesh.quaternion.clone();

        this.cameraManager.updateMaxCameraDistance(mesh);
        this.cameraManager.focusMesh(mesh);
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

        let zoomValue: number;

        // Mac zoom gesture
        if (event.ctrlKey) {
            event.preventDefault();
            event.stopImmediatePropagation();
            zoomValue = event.wheelDelta / 12000;
        } else {
            zoomValue = -event.wheelDelta / 300;
        }

        this.cameraManager.zoom(zoomValue);
    }


    public zoomIn() {

        this.cameraManager.zoomSmoothly(-0.25);
    }


    public zoomOut() {

        this.cameraManager.zoomSmoothly(0.25);
    }


    public resetRotation() {

        this.mesh.setRotationFromQuaternion(this.originalRotation);
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

        this.cameraManager.drag(deltaX / 1000, -deltaY / 1000);
    }


    private rotate(deltaX: number, deltaY: number) {

        if (!this.mesh) return;

        this.cameraManager.rotate(this.mesh, deltaY / 100, deltaX / 100);
    }
}