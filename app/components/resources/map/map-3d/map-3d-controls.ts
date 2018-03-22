import * as THREE from 'three';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Map3DControlState} from './map-3d-control-state';
import {MeshGeometryManager} from './geometries/mesh-geometry-manager';
import {IntersectionHelper} from '../../../../core/3d/intersection-helper';
import {Map3DCameraManager} from './map-3d-camera-manager';
import {VisibilityHelper} from '../../../../core/3d/visibility-helper';
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


    constructor(private cameraManager: Map3DCameraManager,
                private meshGeometryManager: MeshGeometryManager,
                private intersectionHelper: IntersectionHelper) {}


    public getCameraDirection = () => this.cameraDirection;


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

        this.cameraManager.zoom(zoomValue);
    }


    public zoomIn() {

        this.cameraManager.zoomSmoothly(-BUTTON_ZOOM_VALUE);
    }


    public zoomOut() {

        this.cameraManager.zoomSmoothly(BUTTON_ZOOM_VALUE);
    }


    public setSelectedDocument(document: IdaiFieldDocument|undefined) {

        if (document == this.state.selectedDocument) return;

        this.state.selectedDocument = document;

        if (!document) return;

        this.focusGeometry(document);
    }


    public rotateCamera(clockwise: boolean) {

        if (!this.isCameraAnimationAllowed()) return;

        if (clockwise) {
            this.cameraDirection = this.cameraDirection == 3 ? 0 : this.cameraDirection += 1;
        } else {
            this.cameraDirection = this.cameraDirection == 0 ? 3 : this.cameraDirection -= 1;
        }

        this.cameraManager.rotateSmoothly(clockwise ? Math.PI / 2 : -Math.PI / 2,
            this.cameraDirection);
    }


    public isCameraAnimationAllowed(): boolean {

        return !this.cameraManager.isAnimationRunning();
    }


    public focusMesh(mesh: THREE.Mesh) {

        this.cameraManager.focusMesh(mesh);
    }


    private beginDragAction() {

        this.state.dragging = true;
        this.dragCounter = 0;
    }


    private resetAction() {

        this.state.dragging = false;
    }


    private drag(mouseDeltaX: number, mouseDeltaY: number) {

        const { deltaX, deltaZ } = this.getDragDeltas(mouseDeltaX, mouseDeltaY);


        this.cameraManager.drag(deltaX / 100, deltaZ / 100);


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


    private focusGeometry(document: IdaiFieldDocument) {

        if (has3DPointGeometry(document)) {
            this.focusPointGeometry(document);
        } else if (has3DLineGeometry(document) || has3DPolygonGeometry(document)) {
            this.focusMeshGeometry(document);
        }
    }


    private focusPointGeometry(document: IdaiFieldDocument) {

        const geometry: IdaiFieldGeometry = document.resource.geometry as IdaiFieldGeometry;
        const point: THREE.Vector3 = getPointVector(geometry.coordinates);

        if (!VisibilityHelper.isInCameraViewFrustum(point, this.cameraManager.getCamera())) {
            this.cameraManager.focusPoint(point);
        }
    }


    private focusMeshGeometry(document: IdaiFieldDocument) {

        const mesh: THREE.Mesh|undefined = this.meshGeometryManager.getMesh(document);
        if (mesh) this.focusMesh(mesh);
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
}