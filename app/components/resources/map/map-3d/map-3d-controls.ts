import * as THREE from 'three';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Viewer3D} from '../../../../core/3d/viewer-3d';
import {Map3DLayer} from './map-3d-layer';
import {Map3DLayerManager} from './map-3d-layer-manager';
import {Map3DControlState} from './map-3d-control-state';


/**
 * @author Thomas Kleinke
 */
export class Map3DControls {
    
    private state: Map3DControlState = { action: 'none' };

    private dragCounter: number;
    private noSelection: boolean = false;

    private lastXPosition: number;
    private lastYPosition: number;

    private focusedMesh: THREE.Mesh|undefined;
    private focusedMeshOriginalRotation: THREE.Quaternion;


    constructor(private viewer: Viewer3D,
                private objectManager: Map3DLayerManager) {}


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

        this.viewer.getCamera().translateZ(event.wheelDelta / 100);
    }


    public setSelectedDocument(document: IdaiFieldDocument|undefined) {

        if (document == this.state.selectedDocument) return;

        if (this.state.selectedDocument) this.quitFocus();
        if (document) this.focusObjectOfDocument(document);

        this.state.selectedDocument = document;

        this.updateHoverDocument(this.lastXPosition, this.lastYPosition);
    }


    private beginDragAction() {

        this.state.action = 'drag';
        this.dragCounter = 0;
    }


    private resetAction() {

        this.state.action = 'none';
    }


    private performAction(deltaX: number, deltaY: number) {

        switch (this.state.action) {
            case 'drag':
                this.drag(deltaX, deltaY);
                break;
        }
    }


    private drag(deltaX: number, deltaY: number) {

        this.viewer.getCamera().translateX(deltaX / 100);
        this.viewer.getCamera().translateY(-deltaY / 100);

        this.dragCounter++;
        if (this.dragCounter > 10 || deltaX > 5 || deltaX < -5 || deltaY > 5 || deltaY < -5) {
            this.noSelection = true;
        }
    }


    private updateSelectedDocument(xPosition: number, yPosition: number) {

        if (this.noSelection) {
            this.noSelection = false;
            return;
        }

        const clickedObject: Map3DLayer|undefined = this.getObjectAtMousePosition(xPosition, yPosition);
        this.setSelectedDocument(clickedObject ? clickedObject.document : undefined);
    }


    private updateHoverDocument(xPosition: number, yPosition: number) {

        const hoverObject: Map3DLayer|undefined = this.getObjectAtMousePosition(xPosition, yPosition);
        this.state.hoverDocument = hoverObject && hoverObject.document != this.state.selectedDocument ?
            hoverObject.document :
            undefined;
    }


    private getObjectAtMousePosition(xPosition: number, yPosition: number): Map3DLayer|undefined {

        const intersections: Array<THREE.Intersection> = this.getIntersections(xPosition, yPosition);

        if (intersections.length == 0) return undefined;

        return this.objectManager.getLayerByModelId(intersections[0].object.uuid);
    }


    private getIntersections(xPosition: number, yPosition: number): Array<THREE.Intersection> {

        const renderer: THREE.WebGLRenderer = this.viewer.getRenderer();
        const scene: THREE.Scene = this.viewer.getScene();

        const raycaster: THREE.Raycaster = new THREE.Raycaster();

        const x: number = ((xPosition - renderer.domElement.getBoundingClientRect().left)
            / renderer.domElement.getBoundingClientRect().width) * 2 - 1;
        const y: number = -((yPosition - renderer.domElement.getBoundingClientRect().top)
            / renderer.domElement.getBoundingClientRect().height) * 2 + 1;
        const coordinates: THREE.Vector2 = new THREE.Vector2(x, y);

        raycaster.setFromCamera(coordinates, this.viewer.getCamera());

        return raycaster.intersectObjects(scene.children, true);
    }


    private focusObjectOfDocument(document: IdaiFieldDocument) {

        const object: Map3DLayer|undefined
            = this.objectManager.getLayerByDocumentResourceId(document.resource.id as string);

        if (object) this.focusObject(object);
    }


    private quitFocus() {

        if (!this.focusedMesh) return;

        this.focusedMesh.setRotationFromQuaternion(this.focusedMeshOriginalRotation);
        this.focusedMesh = undefined;
    }


    private focusObject(object: Map3DLayer) {

        const position: THREE.Vector3 = object.mesh.getWorldPosition();
        const camera: THREE.Camera = this.viewer.getCamera();

        this.focusedMesh = object.mesh;
        this.focusedMeshOriginalRotation = object.mesh.quaternion.clone();

        camera.position.set(position.x, position.y + 6, position.z);
        camera.lookAt(position);
    }
}