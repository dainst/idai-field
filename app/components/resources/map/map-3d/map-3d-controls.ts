import * as THREE from 'three';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Viewer3D} from '../../../../core/3d/viewer-3d';
import {Map3DControlState} from './map-3d-control-state';
import {MeshGeometryManager} from './geometries/mesh-geometry-manager';
import {IntersectionHelper} from '../../../../core/3d/intersection-helper';
import {getPointVector, has3DLineGeometry, has3DPointGeometry,
    has3DPolygonGeometry} from '../../../../util/util-3d';


export const CAMERA_DIRECTION_NORTH: number = 0;
export const CAMERA_DIRECTION_WEST: number = 1;
export const CAMERA_DIRECTION_SOUTH: number = 2;
export const CAMERA_DIRECTION_EAST: number = 3;

const BUTTON_ZOOM_VALUE: number = 3.5;


/**
 * @author Thomas Kleinke
 */
export class Map3DControls {
    
    private state: Map3DControlState = { dragging: false };

    private dragCounter: number;
    private noSelection: boolean = false;

    private lastXPosition: number;
    private lastYPosition: number;

    private cameraDirection: number = CAMERA_DIRECTION_NORTH;

    private intersectionHelper: IntersectionHelper;


    constructor(private viewer: Viewer3D,
                private meshGeometryManager: MeshGeometryManager) {

        this.intersectionHelper = new IntersectionHelper(viewer);
    }


    public onMouseDown(event: MouseEvent): Map3DControlState {

        this.lastXPosition = event.clientX;
        this.lastYPosition = event.clientY;

        switch (event.which) {
            case 1:  // Left mouse button
                this.beginDragAction();
                break;
        }

        event.preventDefault();

        return this.state;
    }


    public onMouseUp(event: MouseEvent): Map3DControlState {

        if (this.state.dragging) this.updateSelectedDocument(event.clientX, event.clientY);

        this.resetAction();

        return this.state;
    }


    public onMouseMove(event: MouseEvent): Map3DControlState {

        const deltaX = this.lastXPosition - event.clientX;
        const deltaY = this.lastYPosition - event.clientY;

        if (this.state.dragging) this.drag(deltaX, deltaY);
        this.updateHoverDocument(event.clientX, event.clientY);

        this.lastXPosition = event.clientX;
        this.lastYPosition = event.clientY;

        return this.state;
    }


    public onWheel(event: WheelEvent) {

        let zoomValue: number;

        // Mac zoom gesture
        if (event.ctrlKey) {
            event.preventDefault();
            event.stopImmediatePropagation();
            zoomValue = event.wheelDelta / 500;
        } else {
            zoomValue = -event.wheelDelta / 100;
        }

        this.zoom(zoomValue);
    }


    public zoomIn() {

        this.zoomSmoothly(-BUTTON_ZOOM_VALUE);
    }


    public zoomOut() {

        this.zoomSmoothly(BUTTON_ZOOM_VALUE);
    }


    public setSelectedDocument(document: IdaiFieldDocument|undefined) {

        if (document == this.state.selectedDocument) return;

        this.state.selectedDocument = document;

        if (!document) return;

        const geometry: IdaiFieldGeometry = document.resource.geometry as IdaiFieldGeometry;
        if (has3DPointGeometry(document)) {
            this.focusPoint(getPointVector(geometry.coordinates));
        } else if (has3DLineGeometry(document) || has3DPolygonGeometry(document)) {
            this.focusMesh(this.meshGeometryManager.getMesh(document));
        }
    }


    public focusMesh(mesh: THREE.Mesh|undefined) {

        if (!mesh) return;

        const position: THREE.Vector3 = mesh.getWorldPosition();
        const camera: THREE.PerspectiveCamera = this.viewer.getCamera();

        camera.position.set(
            position.x,
            mesh.position.y + Map3DControls.computeFocusDistance(camera, mesh),
            position.z);
        camera.lookAt(position);
        camera.rotateZ((Math.PI / 2) * this.cameraDirection);
    }


    public rotateCamera(clockwise: boolean) {

        if (!this.isCameraAnimationAllowed()) return;

        if (clockwise) {
            this.cameraDirection = this.cameraDirection == 3 ? 0 : this.cameraDirection += 1;
        } else {
            this.cameraDirection = this.cameraDirection == 0 ? 3 : this.cameraDirection -= 1;
        }

        const clonedCamera: THREE.PerspectiveCamera = this.viewer.getCamera().clone();

        if (clockwise) {
            clonedCamera.rotateZ(Math.PI / 2);
        } else {
            clonedCamera.rotateZ(-Math.PI / 2);
        }

        this.viewer.startCameraAnimation(clonedCamera.position, clonedCamera.quaternion);
    }


    public isCameraAnimationAllowed(): boolean {

        return !this.viewer.isCameraAnimationRunning();
    }


    private focusPoint(point: THREE.Vector3) {

        const camera: THREE.PerspectiveCamera = this.viewer.getCamera();

        camera.position.set(
            point.x,
            camera.position.y > point.y ? camera.position.y : point.y + 3,
            point.z);
        camera.lookAt(point);
        camera.rotateZ((Math.PI / 2) * this.cameraDirection);
    }


    private beginDragAction() {

        this.state.dragging = true;
        this.dragCounter = 0;
    }


    private resetAction() {

        this.state.dragging = false;
    }


    private zoom(value: number) {

        this.viewer.getCamera().translateZ(value);
    }


    private zoomSmoothly(value: number) {

        if (!this.isCameraAnimationAllowed()) return;

        const clonedCamera: THREE.PerspectiveCamera = this.viewer.getCamera().clone();
        clonedCamera.translateZ(value);

        this.viewer.startCameraAnimation(clonedCamera.position, clonedCamera.quaternion);
    }


    private drag(mouseDeltaX: number, mouseDeltaY: number) {

        const { deltaX, deltaZ } = this.getDragDeltas(mouseDeltaX, mouseDeltaY);
        const position: THREE.Vector3 = this.viewer.getCamera().position;

        this.viewer.getCamera().position.set(
            position.x + (deltaX / 100),
            position.y,
            position.z + (deltaZ / 100)
        );

        this.dragCounter++;
        if (this.dragCounter > 10 || deltaX > 5 || deltaX < -5 || deltaZ > 5 || deltaZ < -5) {
            this.noSelection = true;
        }
    }


    private getDragDeltas(mouseDeltaX: number,
                          mouseDeltaY: number): { deltaX: number, deltaZ: number } {

        switch(this.cameraDirection) {
            case CAMERA_DIRECTION_WEST:
                return { deltaX: mouseDeltaY, deltaZ: -mouseDeltaX };
            case CAMERA_DIRECTION_SOUTH:
                return { deltaX: -mouseDeltaX, deltaZ: -mouseDeltaY };
            case CAMERA_DIRECTION_EAST:
                return { deltaX: -mouseDeltaY, deltaZ: mouseDeltaX };
            case CAMERA_DIRECTION_NORTH:
            default:
                return { deltaX: mouseDeltaX, deltaZ: mouseDeltaY };
        }
    }


    private updateSelectedDocument(xPosition: number, yPosition: number) {

        if (this.noSelection) {
            this.noSelection = false;
            return;
        }

        this.setSelectedDocument(this.getDocumentOfGeometryAtMousePosition(xPosition, yPosition));
    }


    private updateHoverDocument(xPosition: number, yPosition: number) {

        this.state.hoverDocument = this.getDocumentOfGeometryAtMousePosition(xPosition, yPosition);
    }


    private getDocumentOfGeometryAtMousePosition(xPosition: number, yPosition: number)
            : IdaiFieldDocument|undefined {

        const intersections: Array<THREE.Intersection> = this.intersectionHelper.getIntersections(
            new THREE.Vector2(xPosition, yPosition),
            this.meshGeometryManager.getRaycasterObjects()
        );

        if (intersections.length == 0) return undefined;

        return this.meshGeometryManager.getDocument(intersections[0].object);
    }


    private static computeFocusDistance(camera: THREE.PerspectiveCamera, mesh: THREE.Mesh): number {

        const fovInRadians: number = camera.fov * (Math.PI / 180);
        const size = mesh.geometry.boundingSphere.radius;

        return Math.abs(size / Math.sin(fovInRadians / 2));
    }
}