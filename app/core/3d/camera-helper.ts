import * as THREE from 'three';
import {DepthMap} from './depth-map';

const TWEEN = require('tweenjs');


export type CameraMode = 'perspective'|'orthographic';


/**
 * @author Thomas Kleinke
 */
export class CameraHelper {

    private mode: CameraMode;

    private perspectiveCamera: THREE.PerspectiveCamera;
    private orthographicCamera: THREE.OrthographicCamera;

    private perspectiveYLevel: number = 5;
    private orthographicYLevel: number = 5;
    private orthographicZoomLevel: number = 1;

    private cameraAnimation: {
        targetPosition: THREE.Vector3,
        targetQuaternion: THREE.Quaternion,
        zoom: number,
        progress: number
    }|undefined;


    public initialize(canvasWidth: number, canvasHeight: number) {

        this.createPerspectiveCamera(canvasWidth, canvasHeight);
        this.createOrthographicCamera(canvasWidth, canvasHeight);
    }


    public getMode(): CameraMode {

        return this.mode;
    }


    public setMode(mode: CameraMode) {

        if (mode == this.mode) return;

        if (mode == 'perspective') {
            this.switchFromOrthographicToPerspective();
        } else {
            this.switchFromPerspectiveToOrthographic();
        }

        this.mode = mode;
    }


    public getCamera(): THREE.PerspectiveCamera|THREE.OrthographicCamera {

        return this.mode == 'perspective' ? this.perspectiveCamera : this.orthographicCamera;
    }


    public resize(canvasWidth: number, canvasHeight: number) {

        this.updatePerspectiveCameraAspect(canvasWidth, canvasHeight);
        this.updateOrthographicCameraFrustum(canvasWidth, canvasHeight);
    }


    public startAnimation(targetPosition: THREE.Vector3, targetQuaternion: THREE.Quaternion,
                          targetZoom: number) {

        if (this.cameraAnimation) return;

        this.cameraAnimation = {
            targetPosition: targetPosition,
            targetQuaternion: targetQuaternion,
            zoom: this.getCamera().zoom,
            progress: 0
        };

        new TWEEN.Tween(this.cameraAnimation)
            .to({ progress: 1, zoom: targetZoom }, 300)
            .easing(TWEEN.Easing.Linear.None)
            .start();
    }


    public isAnimationRunning(): boolean {

        return this.cameraAnimation != undefined;
    }


    public animate() {

        if (!this.cameraAnimation) return;

        TWEEN.update();

        this.getCamera().position.lerp(
            this.cameraAnimation.targetPosition,
            this.cameraAnimation.progress
        );

        this.getCamera().quaternion.slerp(
            this.cameraAnimation.targetQuaternion,
            this.cameraAnimation.progress
        );

        this.getCamera().zoom = this.cameraAnimation.zoom;
        this.getCamera().updateProjectionMatrix();

        if (this.cameraAnimation.progress == 1) this.cameraAnimation = undefined;
    }


    public focusMesh(mesh: THREE.Mesh, cameraRotation: number) {

        const meshPosition: THREE.Vector3 = mesh.getWorldPosition();

        this.focusPoint(meshPosition, cameraRotation);

        this.zoomPerspectiveCameraToFit(mesh);
        this.zoomOrthographicCameraToFit(mesh);

        this.saveState();
    }


    public focusPoint(point: THREE.Vector3, cameraRotation: number) {

        CameraHelper.focusPoint(this.perspectiveCamera, point, 3, cameraRotation);
        CameraHelper.focusPoint(this.orthographicCamera, point, 20, cameraRotation);

        this.saveState();
    }


    public zoom(value: number, camera?: THREE.Camera) {

        if (this.mode == 'perspective') {
            this.zoomPerspectiveCamera(value, camera as THREE.PerspectiveCamera);
        } else {
            this.zoomOrthographicCamera(value, camera as THREE.OrthographicCamera);
        }
    }


    public zoomSmoothly(value: number) {

        if (this.isAnimationRunning()) return;

        const clonedCamera: THREE.PerspectiveCamera|THREE.OrthographicCamera = this.getCamera().clone();
        this.zoom(value, clonedCamera);

        this.startAnimation(clonedCamera.position, clonedCamera.quaternion, clonedCamera.zoom);
    }


    private createPerspectiveCamera(canvasWidth: number, canvasHeight: number) {

        this.perspectiveCamera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000);
        this.perspectiveCamera.position.set(0, this.perspectiveYLevel, 0);
        CameraHelper.applyDefaultSettings(this.perspectiveCamera);
    }


    private createOrthographicCamera(canvasWidth: number, canvasHeight: number) {

        this.orthographicCamera = new THREE.OrthographicCamera(
            -canvasWidth / 50, canvasWidth / 50,
            canvasHeight / 50, -canvasHeight / 50,
            0.1, 1000);
        this.orthographicCamera.position.set(0, this.orthographicYLevel, 0);

        CameraHelper.applyDefaultSettings(this.orthographicCamera);
    }


    private updatePerspectiveCameraAspect(canvasWidth: number, canvasHeight: number) {

        this.perspectiveCamera.aspect = canvasWidth / canvasHeight;
        this.perspectiveCamera.updateProjectionMatrix();
    }


    private updateOrthographicCameraFrustum(canvasWidth: number, canvasHeight: number) {

        this.orthographicCamera.left = -canvasWidth / 50;
        this.orthographicCamera.right = canvasWidth / 50;
        this.orthographicCamera.top = canvasHeight / 50;
        this.orthographicCamera.bottom = -canvasHeight / 50;
        this.orthographicCamera.updateProjectionMatrix();
    }


    private zoomPerspectiveCamera(value: number, camera: THREE.PerspectiveCamera = this.perspectiveCamera) {

        camera.translateZ(value);
    }


    private zoomOrthographicCamera(value: number, camera: THREE.OrthographicCamera = this.orthographicCamera) {

        camera.zoom -= value / 2;
        if (camera.zoom < 0) camera.zoom = 0;
        camera.updateProjectionMatrix();
    }
    
    
    private zoomPerspectiveCameraToFit(mesh: THREE.Mesh) {

        const fovInRadians: number = this.perspectiveCamera.fov * (Math.PI / 180);
        const size = Math.max(mesh.geometry.boundingBox.getSize().x, mesh.geometry.boundingBox.getSize().z);
        const yDistance: number = Math.abs((size / 2) / Math.sin(fovInRadians / 2));

        this.perspectiveCamera.position.setY(mesh.position.y + yDistance);
    }


    private zoomOrthographicCameraToFit(mesh: THREE.Mesh) {

        const width: number = this.orthographicCamera.right - this.orthographicCamera.left;
        const height: number = this.orthographicCamera.top - this.orthographicCamera.bottom;

        this.orthographicCamera.position.y = mesh.position.y + 20;

        const boundingBox: THREE.Box3 = mesh.geometry.boundingBox;

        this.orthographicCamera.zoom = Math.min(width / boundingBox.getSize().x,
            height / boundingBox.getSize().z);
        this.orthographicCamera.updateProjectionMatrix();
    }


    private switchFromOrthographicToPerspective() {

        this.perspectiveCamera.position.set(
            this.orthographicCamera.position.x,
            this.perspectiveYLevel,
            this.orthographicCamera.position.z
        );

        this.perspectiveCamera.setRotationFromQuaternion(this.orthographicCamera.quaternion);
    }


    private switchFromPerspectiveToOrthographic() {

        this.orthographicCamera.position.set(
            this.perspectiveCamera.position.x,
            this.orthographicYLevel,
            this.perspectiveCamera.position.z
        );

        this.orthographicCamera.setRotationFromQuaternion(this.perspectiveCamera.quaternion);

        this.orthographicCamera.zoom = this.orthographicZoomLevel;
        this.orthographicCamera.updateProjectionMatrix();
    }


    private saveState() {

        this.perspectiveYLevel = this.perspectiveCamera.position.y;
        this.orthographicYLevel = this.orthographicCamera.position.y;
        this.orthographicZoomLevel = this.orthographicCamera.zoom;
    }


    private static applyDefaultSettings(camera: THREE.Camera) {

        camera.lookAt(new THREE.Vector3(0, 0, 0));
        camera.layers.enable(DepthMap.NO_DEPTH_MAPPING_LAYER);
    }


    private static focusPoint(camera: THREE.Camera, point: THREE.Vector3, yDistance: number,
                              cameraRotation: number) {

        camera.position.set(
            point.x,
            camera.position.y > point.y ? camera.position.y : point.y + yDistance,
            point.z);
        camera.lookAt(point);
        camera.rotateZ((Math.PI / 2) * cameraRotation);
    }
}