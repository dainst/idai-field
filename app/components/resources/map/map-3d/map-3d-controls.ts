import * as THREE from 'three';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Map3D} from './map-3d';
import {Object3D} from './object-3d';
import {ObjectManager} from './object-manager';


/**
 * @author Thomas Kleinke
 */
export class Map3DControls {

    private mouseMode: string = 'none'; // drag, rotate, zoom

    private dragCounter: number;
    private noSelection: boolean = false;

    private lastXPosition: number;
    private lastYPosition: number;

    private selectedDocument: IdaiFieldDocument|undefined;
    private focusedMesh: THREE.Mesh|undefined;
    private focusedMeshOriginalRotation: THREE.Quaternion;


    constructor(private map: Map3D,
                private objectManager: ObjectManager) {}


    public onMouseDown(event: MouseEvent) {

        this.lastXPosition = event.clientX;
        this.lastYPosition = event.clientY;

        switch (event.which) {
            case 1:  // Left mouse button
                this.enterDragMode();
                break;

            case 3:  // Right mouse button
                this.enterRotateMode();
                break;
        }

        event.preventDefault();
    }


    public onMouseUp(event: MouseEvent): IdaiFieldDocument|undefined {

        if (this.mouseMode == 'drag') this.updateSelectedDocument(event.clientX, event.clientY);

        this.resetMouseMode();

        return this.selectedDocument;
    }


    public onMouseMove(event: MouseEvent) {

        const deltaX = this.lastXPosition - event.clientX;
        const deltaY = this.lastYPosition - event.clientY;

        switch (this.mouseMode) {
            case 'drag':
                this.drag(deltaX, deltaY);
                break;

            case 'rotate':
                this.rotate(deltaX, deltaY);
                break;
        }

        this.lastXPosition = event.clientX;
        this.lastYPosition = event.clientY;
    }


    public onWheel(event: WheelEvent) {

        this.map.getCamera().translateZ(event.wheelDelta / 100);
    }


    public setSelectedDocument(document: IdaiFieldDocument|undefined) {

        if (document == this.selectedDocument) return;

        if (this.selectedDocument) this.quitFocus();
        if (document) this.focusObjectOfDocument(document);

        this.selectedDocument = document;
    }


    private enterDragMode() {

        this.mouseMode = 'drag';
        this.dragCounter = 0;
    }


    private enterRotateMode() {

        this.mouseMode = 'rotate';
    }


    private resetMouseMode() {

        this.mouseMode = 'none';
    }


    private drag(deltaX: number, deltaY: number) {

        this.map.getCamera().translateX(deltaX / 100);
        this.map.getCamera().translateY(-deltaY / 100);

        this.dragCounter++;
        if (this.dragCounter > 10 || deltaX > 5 || deltaX < -5 || deltaY > 5 || deltaY < -5) {
            this.noSelection = true;
        }
    }


    private rotate(deltaX: number, deltaY: number) {

        if (this.focusedMesh) {
            this.focusedMesh.rotation.x += deltaY / 100;
            this.focusedMesh.rotation.y += deltaX / 100;
        } else {
            this.map.getCamera().rotation.x += deltaY / 100;
            this.map.getCamera().rotation.y += deltaX / 100;
        }
    }


    private updateSelectedDocument(xPosition: number, yPosition: number): IdaiFieldDocument|undefined {

        if (this.noSelection) {
            this.noSelection = false;
            return this.selectedDocument;
        }

        const clickedObject: Object3D|undefined = this.getClickedObject(xPosition, yPosition);
        this.setSelectedDocument(clickedObject ? clickedObject.document : undefined);
    }


    private getClickedObject(xPosition: number, yPosition: number): Object3D|undefined {

        const intersections: Array<THREE.Intersection> = this.getIntersections(xPosition, yPosition);

        if (intersections.length == 0) return undefined;

        return this.objectManager.get3DObjectByModelId(intersections[0].object.uuid);
    }


    private getIntersections(xPosition: number, yPosition: number): Array<THREE.Intersection> {

        const renderer: THREE.WebGLRenderer = this.map.getRenderer();
        const scene: THREE.Scene = this.map.getScene();

        const raycaster: THREE.Raycaster = new THREE.Raycaster();

        const x: number = ((xPosition - renderer.domElement.getBoundingClientRect().left)
            / renderer.domElement.getBoundingClientRect().width) * 2 - 1;
        const y: number = -((yPosition - renderer.domElement.getBoundingClientRect().top)
            / renderer.domElement.getBoundingClientRect().height) * 2 + 1;
        const coordinates: THREE.Vector2 = new THREE.Vector2(x, y);

        raycaster.setFromCamera(coordinates, this.map.getCamera());

        return raycaster.intersectObjects(scene.children, true);
    }


    private focusObjectOfDocument(document: IdaiFieldDocument) {

        const object: Object3D|undefined
            = this.objectManager.get3DObjectByDocumentResourceId(document.resource.id as string);

        if (object) this.focusObject(object);
    }


    private quitFocus() {

        if (!this.focusedMesh) return;

        this.focusedMesh.setRotationFromQuaternion(this.focusedMeshOriginalRotation);
        this.focusedMesh = undefined;
    }


    private focusObject(object: Object3D) {

        const position: THREE.Vector3 = object.mesh.getWorldPosition();
        const camera: THREE.Camera = this.map.getCamera();

        this.focusedMesh = object.mesh;
        this.focusedMeshOriginalRotation = object.mesh.quaternion.clone();

        camera.position.set(position.x, position.y + 6, position.z);
        camera.lookAt(position);
    }
}