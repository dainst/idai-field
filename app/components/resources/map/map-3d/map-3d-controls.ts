import * as THREE from 'three';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Map3DControlState} from './map-3d-control-state';
import {MeshGeometryManager} from './geometries/mesh-geometries/mesh-geometry-manager';
import {IntersectionHelper} from '../../../core-3d/helpers/intersection-helper';
import {Map3DCameraManager} from './map-3d-camera-manager';
import {VisibilityHelper} from '../../../core-3d/helpers/visibility-helper';
import {getPointVector, has3DLineGeometry, has3DPointGeometry,
    has3DPolygonGeometry} from '../../../../util/util-3d';


const BUTTON_ZOOM_VALUE: number = 3.5;


/**
 * @author Thomas Kleinke
 */
export class Map3DControls {
    
    private state: Map3DControlState = { action: 'none' };

    private dragCounter: number;
    private noSelection: boolean = false;

    private lastXPosition: number;
    private lastYPosition: number;


    constructor(private cameraManager: Map3DCameraManager,
                private meshGeometryManager: MeshGeometryManager,
                private intersectionHelper: IntersectionHelper) {}


    public onMouseDown(event: MouseEvent): Map3DControlState {

        this.lastXPosition = event.clientX;
        this.lastYPosition = event.clientY;

        switch (event.which) {
            case 1:  // Left mouse button
                this.beginDragAction();
                break;
            case 3:  // Right mouse button
                this.beginChangeAngleAction();
                break;
        }

        event.preventDefault();

        return this.state;
    }


    public onMouseUp(event: MouseEvent): Map3DControlState {

        if (this.state.action == 'drag') this.updateSelectedDocument(event.clientX, event.clientY);

        this.resetAction();

        return this.state;
    }


    public onMouseMove(event: MouseEvent): Map3DControlState {

        const deltaX = this.lastXPosition - event.clientX;
        const deltaY = this.lastYPosition - event.clientY;

        this.performAction(deltaX, deltaY);
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


    public focusMesh(mesh: THREE.Mesh) {

        this.cameraManager.focusMesh(mesh);
    }


    private performAction(deltaX: number, deltaY: number) {

        if (this.state.action == 'drag') {
            this.drag(deltaX, deltaY);
        } else if (this.state.action == 'changeAngle') {
            this.changeAngle(deltaY);
        }
    }


    private beginDragAction() {

        this.state.action = 'drag';
        this.dragCounter = 0;
    }


    private beginChangeAngleAction() {

        this.state.action = 'changeAngle';
    }


    private resetAction() {

        this.state.action = 'none';
    }


    private drag(mouseDeltaX: number, mouseDeltaY: number) {

        const {xChange, zChange} = this.cameraManager.drag(mouseDeltaX / 100, mouseDeltaY / 100);

        // Prevent selection of mesh geometries if a distinguishable drag action is performed
        this.dragCounter++;
        if (this.dragCounter > 10 || xChange > 5 || xChange < -5 || zChange > 5 || zChange < -5) {
            this.noSelection = true;
        }
    }


    private changeAngle(mouseDeltaY: number) {

        this.cameraManager.changeAngle(-mouseDeltaY / 100);
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

        if (!VisibilityHelper.isInCameraViewFrustum(point, this.cameraManager.getCamera().clone())) {
            this.cameraManager.focusPoint(point);
        }
    }


    private focusMeshGeometry(document: IdaiFieldDocument) {

        const mesh: THREE.Mesh|undefined = this.meshGeometryManager.getMesh(document);
        if (mesh) this.focusMesh(mesh);
    }


    private getDocumentOfGeometryAtMousePosition(xPosition: number, yPosition: number)
            : IdaiFieldDocument|undefined {

        const intersections: Array<THREE.Intersection> = this.intersectionHelper.getIntersectionsAtScreenPosition(
            new THREE.Vector2(xPosition, yPosition),
            this.meshGeometryManager.getRaycasterObjects()
        );

        if (intersections.length == 0) return undefined;

        return this.meshGeometryManager.getDocument(intersections[0].object);
    }
}