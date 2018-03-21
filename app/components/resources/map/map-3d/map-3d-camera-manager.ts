import * as THREE from 'three';
import {DepthMap} from '../../../../core/3d/depth-map';
import {CameraManager} from '../../../../core/3d/camera-manager';


export type CameraMode = 'perspective'|'orthographic';


/**
 * @author Thomas Kleinke
 */
export class Map3DCameraManager extends CameraManager {

    private mode: CameraMode = 'perspective';

    private perspectiveCamera: THREE.PerspectiveCamera;
    private orthographicCamera: THREE.OrthographicCamera;

    private perspectiveYLevel: number = 5;
    private orthographicYLevel: number = 5;
    private orthographicZoomLevel: number = 1;


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

        CameraManager.updatePerspectiveCameraAspect(this.perspectiveCamera, canvasWidth, canvasHeight);
        this.updateOrthographicCameraFrustum(canvasWidth, canvasHeight);
    }


    public drag(x: number, z: number) {

        const camera: THREE.Camera = this.getCamera();
        camera.position.set(camera.position.x + x, camera.position.y, camera.position.z + z);
    }


    public rotateSmoothly(radians: number) {

        const clonedCamera: THREE.PerspectiveCamera|THREE.OrthographicCamera = this.getCamera().clone();
        clonedCamera.rotateZ(radians);

        this.startAnimation(clonedCamera.position, clonedCamera.quaternion, clonedCamera.zoom);
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


    public focusMesh(mesh: THREE.Mesh, cameraRotation: number) {

        const meshPosition: THREE.Vector3 = mesh.getWorldPosition();

        this.focusPoint(meshPosition, cameraRotation);

        this.zoomPerspectiveCameraToFit(mesh);
        this.zoomOrthographicCameraToFit(mesh);

        this.saveState();
    }


    public focusPoint(point: THREE.Vector3, cameraRotation: number) {

        CameraManager.focusPoint(this.perspectiveCamera, point, 3, cameraRotation);
        CameraManager.focusPoint(this.orthographicCamera, point, 20, cameraRotation);

        this.saveState();
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

        this.orthographicCamera.zoom = Math.min(
            width / boundingBox.getSize().x,
            width / boundingBox.getSize().z,
            height / boundingBox.getSize().x,
            height / boundingBox.getSize().z
        );
        this.orthographicCamera.updateProjectionMatrix();
    }


    private createPerspectiveCamera(canvasWidth: number, canvasHeight: number) {

        this.perspectiveCamera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000);
        this.perspectiveCamera.position.set(0, this.perspectiveYLevel, 0);
        Map3DCameraManager.applyDefaultSettings(this.perspectiveCamera);
    }


    private createOrthographicCamera(canvasWidth: number, canvasHeight: number) {

        this.orthographicCamera = new THREE.OrthographicCamera(
            -canvasWidth / 50, canvasWidth / 50,
            canvasHeight / 50, -canvasHeight / 50,
            0.1, 1000);
        this.orthographicCamera.position.set(0, this.orthographicYLevel, 0);

        Map3DCameraManager.applyDefaultSettings(this.orthographicCamera);
    }


    private updateOrthographicCameraFrustum(canvasWidth: number, canvasHeight: number) {

        this.orthographicCamera.left = -canvasWidth / 50;
        this.orthographicCamera.right = canvasWidth / 50;
        this.orthographicCamera.top = canvasHeight / 50;
        this.orthographicCamera.bottom = -canvasHeight / 50;
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
}