import * as THREE from 'three';
import {Viewer3D} from '../../core/3d/viewer-3d';


/**
 * @author Thomas Kleinke
 */
export class Object3DViewerControls {
    
    private currentAction: string;  // drag, rotate, none

    private lastXPosition: number;
    private lastYPosition: number;

    private mesh: THREE.Mesh;

    private originalRotation: THREE.Quaternion;
    private maxCameraDistance: number;


    constructor(private viewer: Viewer3D) {}


    public getCurrentAction(): string {

        return this.currentAction;
    }


    public setMesh(mesh: THREE.Mesh) {

        this.mesh = mesh;
        this.mesh.position.set(0, 0, 0);
        this.originalRotation = mesh.quaternion.clone();
        this.maxCameraDistance = Object3DViewerControls.computeFocusDistance(
            this.viewer.getCamera(),
            this.mesh
        ) * 2;

        this.focusMesh();
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
            zoomValue = (event.wheelDelta / 12000) * this.maxCameraDistance
        } else {
            zoomValue = (event.wheelDelta / 300) * -this.maxCameraDistance
        }

        this.zoom(this.getAllowedZoomValue(zoomValue));
    }


    public zoomIn() {

        this.zoomSmoothly(-this.maxCameraDistance / 4);
    }


    public zoomOut() {

        this.zoomSmoothly(this.maxCameraDistance / 4);
    }


    public focusMesh() {

        const camera: THREE.PerspectiveCamera = this.viewer.getCamera();

        camera.position.set(0, Object3DViewerControls.computeFocusDistance(camera, this.mesh), 0);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
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

        if (deltaX != 0) this.viewer.getCamera().translateX((deltaX / 1000) * this.maxCameraDistance);
        if (deltaY != 0) this.viewer.getCamera().translateY((-deltaY / 1000) * this.maxCameraDistance);
    }


    private rotate(deltaX: number, deltaY: number) {

        if (!this.mesh) return;

        this.mesh.rotation.x += deltaY / 100;
        this.mesh.rotation.z += deltaX / 100;
    }


    private getAllowedZoomValue(zoomValue: number): number {

        const camera: THREE.PerspectiveCamera = this.viewer.getCamera();
        const zoomingOut: boolean = zoomValue > 0;

        if (zoomingOut) {
            return camera.position.y + zoomValue <= this.maxCameraDistance ?
                zoomValue :
                this.maxCameraDistance - camera.position.y;
        } else {
            return camera.position.y + zoomValue >= 0 ?
                zoomValue :
                -camera.position.y
        }
    }


    private zoom(value: number) {

        this.viewer.getCamera().translateZ(value);
    }


    private zoomSmoothly(value: number) {

        if (this.viewer.isCameraAnimationRunning()) return;

        const clonedCamera: THREE.PerspectiveCamera = this.viewer.getCamera().clone();
        clonedCamera.translateZ(this.getAllowedZoomValue(value));

        this.viewer.startCameraAnimation(clonedCamera.position, clonedCamera.quaternion);
    }


    private static computeFocusDistance(camera: THREE.PerspectiveCamera, mesh: THREE.Mesh): number {

        const fovInRadians: number = camera.fov * (Math.PI / 180);
        const size = mesh.geometry.boundingSphere.radius;

        return Math.abs(size / Math.sin(fovInRadians / 2));
    }
}