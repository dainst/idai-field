import * as THREE from 'three';
import {DepthMap} from '../../core/3d/depth-map';
import {CameraManager} from '../../core/3d/camera-manager';


/**
 * @author Thomas Kleinke
 */
export class Model3DViewerCameraManager extends CameraManager {

    private camera: THREE.PerspectiveCamera;
    private maxCameraDistance: number = 1;


    public initialize(canvasWidth: number, canvasHeight: number) {

        this.createCamera(canvasWidth, canvasHeight);
    }


    public getCamera(): THREE.PerspectiveCamera {

        return this.camera;
    }


    public resize(canvasWidth: number, canvasHeight: number) {

        CameraManager.updatePerspectiveCameraAspect(this.camera, canvasWidth, canvasHeight);
    }


    public updateMaxCameraDistance(mesh: THREE.Mesh) {

        this.maxCameraDistance = CameraManager.computeDistanceForZoomToFit(
            this.camera,
            mesh.geometry.boundingSphere
        ) * 2;
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

        this.camera.position.set(
            0,
            mesh.position.y + CameraManager.computeDistanceForZoomToFit(this.camera,
                mesh.geometry.boundingSphere),
            0);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    }


    private createCamera(canvasWidth: number, canvasHeight: number) {

        this.camera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 0);
        this.camera.layers.enable(DepthMap.NO_DEPTH_MAPPING_LAYER);
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