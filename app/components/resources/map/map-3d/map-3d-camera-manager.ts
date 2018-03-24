import * as THREE from 'three';
import {DepthMap} from '../../../../core/3d/depth-map';
import {CameraManager} from '../../../../core/3d/camera-manager';


export type CameraMode = 'perspective'|'orthographic';

const CAMERA_DIRECTION_NORTH: number = 0;
const CAMERA_DIRECTION_WEST: number = 1;
const CAMERA_DIRECTION_SOUTH: number = 2;
const CAMERA_DIRECTION_EAST: number = 3;


/**
 * @author Thomas Kleinke
 */
export class Map3DCameraManager extends CameraManager {

    private mode: CameraMode = 'perspective';

    private perspectiveCamera: THREE.PerspectiveCamera;
    private orthographicCamera: THREE.OrthographicCamera;

    private tilted: boolean = false;

    private perspectiveYLevel: number = 5;
    private orthographicYLevel: number = 5;
    private orthographicZoomLevel: number = 1;

    private direction: number = CAMERA_DIRECTION_NORTH;

    private level: number = 0;


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


    public drag(deltaX: number, deltaY: number): { xChange: number, zChange: number } {

        const { xChange, zChange } = this.getDragValues(deltaX, deltaY);

        const camera: THREE.Camera = this.getCamera();
        camera.position.set(camera.position.x + xChange, camera.position.y, camera.position.z + zChange);

        return { xChange, zChange };
    }


    public rotateBy90Degrees(clockwise: boolean) {

        if (this.isAnimationRunning()) return;

        this.direction = Map3DCameraManager.getNextDirection(this.direction, clockwise);
        this.rotateSmoothly(clockwise ? Math.PI / 2 : -Math.PI / 2);
    }


    private rotateSmoothly(radians: number) {

        const pivotPoint: THREE.Vector3 = this.getPivotPoint();
        const clonedCamera: THREE.PerspectiveCamera|THREE.OrthographicCamera = this.getCamera().clone();
        const yAxis: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

        clonedCamera.position.sub(pivotPoint);
        clonedCamera.position.applyAxisAngle(yAxis, radians);
        clonedCamera.position.add(pivotPoint);

        clonedCamera.lookAt(pivotPoint);

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


    public focusMesh(mesh: THREE.Mesh) {

        this.zoomPerspectiveCameraToFit(mesh);
        this.zoomOrthographicCameraToFit(mesh);

        this.level = mesh.position.y;

        this.saveState();
    }


    public focusPoint(point: THREE.Vector3) {

        Map3DCameraManager.focusPoint(this.perspectiveCamera, point, 3);
        Map3DCameraManager.focusPoint(this.orthographicCamera, point, 20);

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

        this.perspectiveCamera.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
        const distance: number = CameraManager.computeZoomToFitDistance(this.perspectiveCamera, mesh);
        this.perspectiveCamera.translateZ(distance);
    }


    private zoomOrthographicCameraToFit(mesh: THREE.Mesh) {

        const width: number = this.orthographicCamera.right - this.orthographicCamera.left;
        const height: number = this.orthographicCamera.top - this.orthographicCamera.bottom;

        this.orthographicCamera.position.set(mesh.position.x, mesh.position.y + 20, mesh.position.z);

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

        if (this.tilted) this.tiltView(false);

        this.orthographicCamera.position.set(
            this.perspectiveCamera.position.x,
            this.orthographicYLevel,
            this.perspectiveCamera.position.z
        );

        this.orthographicCamera.setRotationFromQuaternion(this.perspectiveCamera.quaternion);

        this.orthographicCamera.zoom = this.orthographicZoomLevel;
        this.orthographicCamera.updateProjectionMatrix();
    }


    public tiltView(animate: boolean = true) {

        if (this.isAnimationRunning()) return;

        this.tilted = !this.tilted;

        if (this.mode == 'orthographic') {
            this.setMode('perspective');
            animate = false;
        }

        this.adjustCameraTilt(animate);
    }


    private adjustCameraTilt(animate: boolean) {

        const pivotPoint: THREE.Vector3 = this.getPivotPoint();
        const radians: number = this.tilted ? Math.PI / 4 : -Math.PI / 4;
        const xAxis: THREE.Vector3 = new THREE.Vector3(1, 0, 0);
        const zAxis: THREE.Vector3 = new THREE.Vector3(0, 0, 1);

        const clonedCamera: THREE.PerspectiveCamera = this.perspectiveCamera.clone();

        clonedCamera.position.sub(pivotPoint);

        switch(this.direction) {
            case CAMERA_DIRECTION_NORTH:
                clonedCamera.position.applyAxisAngle(xAxis, radians);
                break;
            case CAMERA_DIRECTION_EAST:
                clonedCamera.position.applyAxisAngle(zAxis, radians);
                break;
            case CAMERA_DIRECTION_WEST:
                clonedCamera.position.applyAxisAngle(zAxis, -radians);
                break;
            case CAMERA_DIRECTION_SOUTH:
                clonedCamera.position.applyAxisAngle(xAxis, -radians);
                break;
        }

        clonedCamera.position.add(pivotPoint);

        clonedCamera.rotateOnAxis(xAxis, radians);

        if (animate) {
            this.startAnimation(clonedCamera.position, clonedCamera.quaternion, clonedCamera.zoom);
        } else {
            this.perspectiveCamera.position.set(
                clonedCamera.position.x,
                clonedCamera.position.y,
                clonedCamera.position.z
            );
            this.perspectiveCamera.quaternion.set(
                clonedCamera.quaternion.x,
                clonedCamera.quaternion.y,
                clonedCamera.quaternion.z,
                clonedCamera.quaternion.w
            );
            this.perspectiveCamera.updateProjectionMatrix();
        }
    }


    private saveState() {

        this.perspectiveYLevel = this.perspectiveCamera.position.y;
        this.orthographicYLevel = this.orthographicCamera.position.y;
        this.orthographicZoomLevel = this.orthographicCamera.zoom;
    }


    private getPivotPoint(): THREE.Vector3 {

        const plane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), this.level);
        const ray: THREE.Ray = new THREE.Ray(
            this.getCamera().position,
            this.getCamera().getWorldDirection()
        );

        return ray.intersectPlane(plane);
    }


    private getDragValues(deltaX: number, deltaY: number): { xChange: number, zChange: number } {

        switch(this.direction) {
            case CAMERA_DIRECTION_WEST:
                return { xChange: deltaY, zChange: -deltaX };
            case CAMERA_DIRECTION_SOUTH:
                return { xChange: -deltaX, zChange: -deltaY };
            case CAMERA_DIRECTION_EAST:
                return { xChange: -deltaY, zChange: deltaX };
            case CAMERA_DIRECTION_NORTH:
            default:
                return { xChange: deltaX, zChange: deltaY };
        }
    }


    private static getNextDirection(direction: number, clockwise: boolean) {

        if (clockwise) {
            return direction == 3 ? 0 : direction + 1;
        } else {
            return direction == 0 ? 3 : direction - 1;
        }
    }


    private static applyDefaultSettings(camera: THREE.Camera) {

        camera.lookAt(new THREE.Vector3(0, 0, 0));
        camera.layers.enable(DepthMap.NO_DEPTH_MAPPING_LAYER);
    }


    protected static focusPoint(camera: THREE.Camera, point: THREE.Vector3, yDistance: number) {

        camera.position.set(point.x, point.y, point.z);
        camera.translateZ(yDistance);
    }
}