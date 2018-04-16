import * as THREE from 'three';
import {DepthMap} from '../../../core-3d/helpers/depth-map';
import {CameraManager} from '../../../core-3d/camera-manager';
import {SceneManager} from '../../../core-3d/scene-manager';
import {GeometriesBounds} from './geometries/geometries-bounds';


export type ProjectionMode = 'perspective'|'orthographic';

const CAMERA_DIRECTION_NORTH: number = 0;
const CAMERA_DIRECTION_WEST: number = 1;
const CAMERA_DIRECTION_SOUTH: number = 2;
const CAMERA_DIRECTION_EAST: number = 3;

const minAngle: number = -1.5607963267948966;
const maxAngle: number = -Math.PI / 6;
const defaultAngle: number = -Math.PI / 3;


/**
 * @author Thomas Kleinke
 */
export class Map3DCameraManager extends CameraManager {

    private projectionMode: ProjectionMode = 'perspective';

    private perspectiveCamera: THREE.PerspectiveCamera;
    private orthographicCamera: THREE.OrthographicCamera;

    private perspectiveCameraPivotPoint: THREE.Vector3|undefined;
    private perspectiveCameraAngle: number;

    private orthographicCameraZoomLevel: number = 2;

    private direction: number = CAMERA_DIRECTION_NORTH;


    constructor(private sceneManager: SceneManager,
                private geometriesBounds: GeometriesBounds) {

        super();
    }


    public initialize(canvasWidth: number, canvasHeight: number) {

        this.createPerspectiveCamera(canvasWidth, canvasHeight);
        this.createOrthographicCamera(canvasWidth, canvasHeight);

        this.geometriesBounds.initializationNotification().subscribe(() => {
           this.focusGeometriesBounds();
        });
    }


    public getProjectionMode(): ProjectionMode {

        return this.projectionMode;
    }


    public setProjectionMode(projectionMode: ProjectionMode) {

        if (projectionMode == this.projectionMode || this.isAnimationRunning()) return;

        if (projectionMode == 'orthographic') this.resetOrthographicZoom();
        this.projectionMode = projectionMode;
    }


    public getCamera(): THREE.PerspectiveCamera|THREE.OrthographicCamera {

        return this.projectionMode == 'perspective' ? this.perspectiveCamera : this.orthographicCamera;
    }


    public resize(canvasWidth: number, canvasHeight: number) {

        CameraManager.updatePerspectiveCameraAspect(this.perspectiveCamera, canvasWidth, canvasHeight);
        this.updateOrthographicCameraFrustum(canvasWidth, canvasHeight);
    }


    public resetPivotPoint() {

        this.perspectiveCameraPivotPoint = undefined;
    }


    public drag(deltaX: number, deltaY: number): { xChange: number, zChange: number } {

        this.resetPivotPoint();

        const { xChange, zChange } = this.getDragValues(deltaX, deltaY);

        Map3DCameraManager.translate(this.perspectiveCamera, xChange, zChange);
        Map3DCameraManager.translate(this.orthographicCamera, xChange, zChange);

        return { xChange, zChange };
    }


    public changeAngle(delta: number) {

        if (this.projectionMode == 'orthographic') return;

        const angleChange: number = this.getAllowedAngleChange(delta);

        if (angleChange != 0) this.applyAngleChange(angleChange, false);
    }


    public setDefaultAngle(animate: boolean = true) {

        if (this.isAnimationRunning()) return;

        if (this.projectionMode == 'orthographic') {
            this.setProjectionMode('perspective');
            animate = false;
        }

        this.applyAngleChange(defaultAngle - this.perspectiveCameraAngle, animate);
    }


    public isDefaultAngle(): boolean {

        return this.perspectiveCameraAngle == defaultAngle;
    }


    public rotateBy90Degrees(clockwise: boolean) {

        if (this.isAnimationRunning()) return;

        this.direction = Map3DCameraManager.getNextDirection(this.direction, clockwise);
        const rotationInRadians: number = clockwise ? Math.PI / 2 : -Math.PI / 2;

        this.rotatePerspectiveCamera(rotationInRadians, this.projectionMode == 'perspective');
        this.rotateOrthographicCamera(rotationInRadians, this.projectionMode == 'orthographic');
    }


    public zoom(value: number, camera?: THREE.Camera) {

        if (this.projectionMode == 'perspective') {
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


    public focusPoint(point: THREE.Vector3) {

        this.resetPivotPoint();

        Map3DCameraManager.focusPoint(this.perspectiveCamera, point, 3);
        Map3DCameraManager.focusPoint(this.orthographicCamera, point, 20);

        this.orthographicCameraZoomLevel = this.orthographicCamera.zoom;
    }


    public focusMesh(mesh: THREE.Mesh) {

        this.resetPivotPoint();

        this.zoomPerspectiveCameraToFit(new THREE.Vector3(mesh.position.x,
            Map3DCameraManager.getMinY(mesh),
            mesh.position.z), mesh.geometry.boundingBox, mesh.geometry.boundingSphere);
        this.zoomOrthographicCameraToFit(mesh.position, mesh.geometry.boundingBox);

        this.orthographicCameraZoomLevel = this.orthographicCamera.zoom;
    }


    private focusGeometriesBounds() {

        this.resetPivotPoint();

        const bounds: THREE.Box3 = this.geometriesBounds.getBounds();

        this.zoomPerspectiveCameraToFit(bounds.getCenter(), bounds);
        this.zoomOrthographicCameraToFit(bounds.getCenter(), bounds);

        this.orthographicCameraZoomLevel = this.orthographicCamera.zoom;
    }


    private zoomPerspectiveCamera(value: number, camera: THREE.PerspectiveCamera = this.perspectiveCamera) {

        camera.translateZ(value);
    }


    private zoomOrthographicCamera(value: number, camera: THREE.OrthographicCamera = this.orthographicCamera) {

        camera.zoom -= value / 2;
        if (camera.zoom < 0) camera.zoom = 0;
        camera.updateProjectionMatrix();
    }


    private zoomPerspectiveCameraToFit(position: THREE.Vector3, boundingBox: THREE.Box3,
                                       boundingSphere?: THREE.Sphere) {

        this.perspectiveCamera.position.set(position.x, position.y, position.z);

        const distance: number = CameraManager.computeDistanceForZoomToFit(
            this.perspectiveCamera,
            boundingSphere ? boundingSphere : boundingBox.getBoundingSphere()
            ) + boundingBox.getSize().y / 2;
        this.perspectiveCamera.translateZ(distance);
    }


    private zoomOrthographicCameraToFit(position: THREE.Vector3, bounds: THREE.Box3) {

        const width: number = this.orthographicCamera.right - this.orthographicCamera.left;
        const height: number = this.orthographicCamera.top - this.orthographicCamera.bottom;

        this.orthographicCamera.position.set(position.x, position.y + 20, position.z);

        this.orthographicCamera.zoom = Math.min(
            width / bounds.getSize().x,
            width / bounds.getSize().z,
            height / bounds.getSize().x,
            height / bounds.getSize().z
        );
        this.orthographicCamera.updateProjectionMatrix();
    }


    private rotatePerspectiveCamera(radians: number, animate: boolean) {

        this.resetPivotPoint();

        const clonedCamera: THREE.PerspectiveCamera = this.perspectiveCamera.clone();
        const pivotPoint: THREE.Vector3 = this.getPivotPoint();
        const yAxis: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

        clonedCamera.position.sub(pivotPoint);
        clonedCamera.position.applyAxisAngle(yAxis, radians);
        clonedCamera.position.add(pivotPoint);

        clonedCamera.lookAt(pivotPoint);

        this.applyChanges(this.perspectiveCamera, clonedCamera, animate);
    }


    private rotateOrthographicCamera(radians: number, animate: boolean) {

        const clonedCamera: THREE.OrthographicCamera = this.orthographicCamera.clone();
        clonedCamera.rotateZ(radians);

        this.applyChanges(this.orthographicCamera, clonedCamera, animate);
    }


    private createPerspectiveCamera(canvasWidth: number, canvasHeight: number) {

        this.perspectiveCamera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000);
        this.perspectiveCamera.position.set(0, 5, 0);
        Map3DCameraManager.applyDefaultSettings(this.perspectiveCamera);

        this.perspectiveCameraAngle = this.perspectiveCamera.rotation.x;
        this.setDefaultAngle(false);
    }


    private createOrthographicCamera(canvasWidth: number, canvasHeight: number) {

        this.orthographicCamera = new THREE.OrthographicCamera(
            -canvasWidth / 50, canvasWidth / 50,
            canvasHeight / 50, -canvasHeight / 50,
            0.1, 1000);
        this.orthographicCamera.position.set(0, 5, 0);

        Map3DCameraManager.applyDefaultSettings(this.orthographicCamera);
    }


    private updateOrthographicCameraFrustum(canvasWidth: number, canvasHeight: number) {

        this.orthographicCamera.left = -canvasWidth / 50;
        this.orthographicCamera.right = canvasWidth / 50;
        this.orthographicCamera.top = canvasHeight / 50;
        this.orthographicCamera.bottom = -canvasHeight / 50;
        this.orthographicCamera.updateProjectionMatrix();
    }


    private resetOrthographicZoom() {

        this.orthographicCamera.zoom = this.orthographicCameraZoomLevel;
        this.orthographicCamera.updateProjectionMatrix();
    }


    private applyAngleChange(angleChange: number, animate: boolean) {

        const pivotPoint: THREE.Vector3 = this.getPivotPoint();
        const clonedCamera: THREE.PerspectiveCamera = this.perspectiveCamera.clone();

        this.moveAroundPivotPoint(clonedCamera, pivotPoint, angleChange);
        clonedCamera.lookAt(pivotPoint);

        this.applyChanges(this.perspectiveCamera, clonedCamera, animate);

        this.perspectiveCameraAngle += angleChange;
    }


    private moveAroundPivotPoint(camera: THREE.Camera, pivotPoint: THREE.Vector3, angleChange: number) {

        camera.position.sub(pivotPoint);
        this.applyAxisAngleToCameraPosition(camera, angleChange);
        camera.position.add(pivotPoint);
    }


    private applyAxisAngleToCameraPosition(camera: THREE.Camera, angleChange: number) {

        const xAxis: THREE.Vector3 = new THREE.Vector3(1, 0, 0);
        const zAxis: THREE.Vector3 = new THREE.Vector3(0, 0, 1);

        switch(this.direction) {
            case CAMERA_DIRECTION_NORTH:
                camera.position.applyAxisAngle(xAxis, angleChange);
                break;
            case CAMERA_DIRECTION_EAST:
                camera.position.applyAxisAngle(zAxis, angleChange);
                break;
            case CAMERA_DIRECTION_WEST:
                camera.position.applyAxisAngle(zAxis, -angleChange);
                break;
            case CAMERA_DIRECTION_SOUTH:
                camera.position.applyAxisAngle(xAxis, -angleChange);
                break;
        }
    }


    private getPivotPoint(): THREE.Vector3 {

        if (!this.perspectiveCameraPivotPoint) this.perspectiveCameraPivotPoint = this.computePivotPoint();

        return this.perspectiveCameraPivotPoint;
    }


    private computePivotPoint(): THREE.Vector3 {

        const ray: THREE.Ray = new THREE.Ray(
            this.perspectiveCamera.position,
            this.perspectiveCamera.getWorldDirection()
        );

        return ray.intersectPlane(this.getGroundPlane());
    }


    private getGroundPlane(): THREE.Plane {

        const groundMesh: THREE.Mesh|undefined = this.getNearestMeshBelowCamera();

        const yPosition: number = groundMesh ?
            Map3DCameraManager.getMinY(groundMesh) :
            this.perspectiveCamera.position.y - 3;

        return new THREE.Plane(new THREE.Vector3(0, -1, 0), yPosition);
    }


    private getNearestMeshBelowCamera(): THREE.Mesh|undefined {

        const meshes: Array<THREE.Mesh> = this.sceneManager.getMeshes()
            .filter(mesh => Map3DCameraManager.getMinY(mesh) < this.getCamera().position.y)
            .sort((mesh1, mesh2) => {
                return Map3DCameraManager.getPositionWithMinY(mesh1).distanceTo(this.getCamera().position)
                    - Map3DCameraManager.getPositionWithMinY(mesh2).distanceTo(this.getCamera().position);
            });

        return meshes.length > 0 ? meshes[0] : undefined;
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


    private getAllowedAngleChange(delta: number): number {

        if (delta < 0) {
            return this.perspectiveCameraAngle + delta >= minAngle ?
                delta :
                minAngle - this.perspectiveCameraAngle;
        } else {
            return this.perspectiveCameraAngle + delta <= maxAngle ?
                delta :
                maxAngle - this.perspectiveCameraAngle;
        }
    }


    private applyChanges(camera: THREE.PerspectiveCamera|THREE.OrthographicCamera,
                         changedClone: THREE.PerspectiveCamera|THREE.OrthographicCamera,
                         animate: boolean) {

        if (animate) {
            this.startAnimation(changedClone.position, changedClone.quaternion, changedClone.zoom);
        } else {
            Map3DCameraManager.updateFromChangedClone(camera, changedClone);
        }
    }


    private static getNextDirection(direction: number, clockwise: boolean) {

        if (clockwise) {
            return direction == 3 ? 0 : direction + 1;
        } else {
            return direction == 0 ? 3 : direction - 1;
        }
    }


    private static getMinY(mesh: THREE.Mesh): number {

        return mesh.position.y + mesh.geometry.boundingBox.min.y;
    }


    private static getPositionWithMinY(mesh: THREE.Mesh): THREE.Vector3 {

        return new THREE.Vector3(mesh.position.x, this.getMinY(mesh), mesh.position.z);
    }


    private static applyDefaultSettings(camera: THREE.PerspectiveCamera|THREE.OrthographicCamera) {

        camera.lookAt(new THREE.Vector3(0, 0, 0));
        camera.layers.enable(DepthMap.NO_DEPTH_MAPPING_LAYER);
    }


    private static updateFromChangedClone(camera: THREE.PerspectiveCamera|THREE.OrthographicCamera,
                                          changedClone: THREE.PerspectiveCamera|THREE.OrthographicCamera) {

        camera.position.set(
            changedClone.position.x,
            changedClone.position.y,
            changedClone.position.z
        );

        camera.quaternion.set(
            changedClone.quaternion.x,
            changedClone.quaternion.y,
            changedClone.quaternion.z,
            changedClone.quaternion.w
        );

        camera.updateProjectionMatrix();
    }


    private static translate(camera: THREE.PerspectiveCamera|THREE.OrthographicCamera,
                             xChange: number, zChange: number) {

        camera.position.set(
            camera.position.x + xChange,
            camera.position.y,
            camera.position.z + zChange
        );
    }


    protected static focusPoint(camera: THREE.Camera, point: THREE.Vector3, yDistance: number) {

        camera.position.set(point.x, point.y, point.z);
        camera.translateZ(yDistance);
    }
}