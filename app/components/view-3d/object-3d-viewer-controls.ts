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


    constructor(private viewer: Viewer3D) {}


    public getCurrentAction(): string {

        return this.currentAction;
    }


    public setMesh(mesh: THREE.Mesh) {

        this.mesh = mesh;
        this.originalRotation = mesh.quaternion.clone();

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

        // Mac zoom gesture
        if (event.ctrlKey) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }

        if (!this.isZoomingAllowed(event.wheelDelta > 0)) return;

        this.viewer.getCamera().translateZ(event.wheelDelta / 100);
    }


    public focusMesh() {

        const position: THREE.Vector3 = this.mesh.getWorldPosition();
        const camera: THREE.PerspectiveCamera = this.viewer.getCamera();

        camera.position.set(
            position.x,
            this.mesh.position.y + Object3DViewerControls.computeFocusDistance(camera, this.mesh),
            position.z);
        camera.lookAt(position);
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

        this.viewer.getCamera().translateX(deltaX / 100);
        this.viewer.getCamera().translateY(-deltaY / 100);
    }


    private rotate(deltaX: number, deltaY: number) {

        if (!this.mesh) return;

        this.mesh.rotation.x += deltaY / 100;
        this.mesh.rotation.z += deltaX / 100;
    }


    private isZoomingAllowed(zoomingOut: boolean): boolean {

        const camera: THREE.PerspectiveCamera = this.viewer.getCamera();
        const maxDistance: number = Object3DViewerControls.computeFocusDistance(camera, this.mesh) * 2;

        if (camera.position.distanceTo(this.mesh.position) <= maxDistance) {
            return true;
        } else {
            return (zoomingOut && camera.position.y <= this.mesh.position.y
                || !zoomingOut && camera.position.y >= this.mesh.position.y);
        }
    }


    private static computeFocusDistance(camera: THREE.PerspectiveCamera, mesh: THREE.Mesh): number {

        const fovInRadians: number = camera.fov * (Math.PI / 180);
        const size = mesh.geometry.boundingSphere.radius;

        return Math.abs(size / Math.sin(fovInRadians / 2));
    }
}