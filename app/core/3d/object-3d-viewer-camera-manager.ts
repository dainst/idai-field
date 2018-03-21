import * as THREE from 'three';
import {DepthMap} from './depth-map';
import {CameraManager} from './camera-manager';
import {PerspectiveCamera} from 'three';


/**
 * @author Thomas Kleinke
 */
export class Object3DViewerCameraManager extends CameraManager {

    private camera: PerspectiveCamera;
    private maxCameraDistance: number = 1;


    public initialize(canvasWidth: number, canvasHeight: number) {

        this.createCamera(canvasWidth, canvasHeight);
    }


    public getCamera(): THREE.PerspectiveCamera {

        return this.camera;
    }


    public resize(canvasWidth: number, canvasHeight: number) {

        this.updatePerspectiveCameraAspect(this.camera, canvasWidth, canvasHeight);
    }


    public updateMaxCameraDistance(mesh: THREE.Mesh) {

        this.maxCameraDistance = this.computeZoomToFitDistance(mesh) * 2;
    }


    public drag(x: number, z: number) {

        this.camera.translateX(x * this.maxCameraDistance);
        this.camera.translateY(z * this.maxCameraDistance);
    }


    public zoom(value: number, camera: THREE.PerspectiveCamera = this.camera) {

        camera.translateZ(this.getAllowedZoomValue(value * this.maxCameraDistance));
    }


    public zoomSmoothly(value: number) {

        if (this.isAnimationRunning()) return;

        const clonedCamera: THREE.PerspectiveCamera = this.getCamera().clone();
        this.zoom(this.getAllowedZoomValue(value), clonedCamera);

        this.startAnimation(clonedCamera.position, clonedCamera.quaternion, clonedCamera.zoom);
    }


    public focusMesh(mesh: THREE.Mesh) {

        this.focusPoint(mesh.getWorldPosition());
        this.zoomToFit(mesh);
    }


    public focusPoint(point: THREE.Vector3) {

        CameraManager.focusPoint(this.camera, point, 1);
    }


    private zoomToFit(mesh: THREE.Mesh) {

        this.camera.position.setY(mesh.position.y + this.computeZoomToFitDistance(mesh));
    }


    private createCamera(canvasWidth: number, canvasHeight: number) {

        this.camera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 0);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.camera.layers.enable(DepthMap.NO_DEPTH_MAPPING_LAYER);
    }


    private computeZoomToFitDistance(mesh: THREE.Mesh): number {

        const fovInRadians: number = this.camera.fov * (Math.PI / 180);
        const size = mesh.geometry.boundingSphere.radius;

        return Math.abs(size / Math.sin(fovInRadians / 2));
    }


    private getAllowedZoomValue(zoomValue: number): number {

        const zoomingOut: boolean = zoomValue > 0;

        if (zoomingOut) {
            return this.camera.position.y + zoomValue <= this.maxCameraDistance ?
                zoomValue :
                this.maxCameraDistance - this.camera.position.y;
        } else {
            return this.camera.position.y + zoomValue >= 0 ?
                zoomValue :
                -this.camera.position.y
        }
    }
}