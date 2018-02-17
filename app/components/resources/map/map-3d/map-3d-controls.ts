import * as THREE from 'three';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Viewer3D} from '../../../../core/3d/viewer-3d';
import {Map3DControlState} from './map-3d-control-state';
import {getPointVector} from '../../../../util/util-3d';


/**
 * @author Thomas Kleinke
 */
export class Map3DControls {
    
    private state: Map3DControlState = { action: 'none' };

    private dragCounter: number;
    private noSelection: boolean = false;

    private lastXPosition: number;
    private lastYPosition: number;


    constructor(private viewer: Viewer3D) {}


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
        //this.updateHoverDocument(event.clientX, event.clientY);

        this.lastXPosition = event.clientX;
        this.lastYPosition = event.clientY;

        return this.state;
    }


    public onWheel(event: WheelEvent) {

        this.viewer.getCamera().translateZ(event.wheelDelta / 100);
    }


    public setSelectedDocument(document: IdaiFieldDocument|undefined) {

        if (document == this.state.selectedDocument) return;

        this.state.selectedDocument = document;

        if (!document) return;

        const geometry: IdaiFieldGeometry|undefined = document.resource.geometry;
        if (geometry && geometry.type == 'Point') this.focusPoint(getPointVector(geometry));
    }


    public focusMesh(mesh: THREE.Mesh) {

        const position: THREE.Vector3 = mesh.getWorldPosition();
        const camera: THREE.PerspectiveCamera = this.viewer.getCamera();

        camera.position.set(
            position.x,
            mesh.position.y + Map3DControls.computeDistance(camera, mesh),
            position.z);
        camera.lookAt(position);
    }



    private focusPoint(point: THREE.Vector3) {

        const camera: THREE.PerspectiveCamera = this.viewer.getCamera();

        camera.position.set(
            point.x,
            camera.position.y > point.y ? camera.position.y : point.y + 3,
            point.z);
        camera.lookAt(point);
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


    private static computeDistance(camera: THREE.PerspectiveCamera, mesh: THREE.Mesh): number {

        const fovInRadians: number = camera.fov * (Math.PI / 180);
        const size = mesh.geometry.boundingSphere.radius;

        return Math.abs(size / Math.sin(fovInRadians / 2));
    }


    private updateSelectedDocument(xPosition: number, yPosition: number) {

        if (this.noSelection) {
            this.noSelection = false;
            return;
        }

        const selectedMeshId: string|undefined = this.getMeshIdAtMousePosition(xPosition, yPosition);

        // TODO properly implement this as soon as mesh geometries are added
        this.setSelectedDocument(undefined);
    }


    private updateHoverDocument(xPosition: number, yPosition: number) {

        const hoverMeshId: string|undefined = this.getMeshIdAtMousePosition(xPosition, yPosition);

        // TODO properly implement this as soon as mesh geometries are added
        this.state.hoverDocument = undefined;
    }


    private getMeshIdAtMousePosition(xPosition: number, yPosition: number): string|undefined {

        const intersections: Array<THREE.Intersection> = this.getIntersections(xPosition, yPosition);

        if (intersections.length == 0) return undefined;

        return intersections[0].object.uuid;
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
}