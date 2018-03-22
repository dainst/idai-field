import {Component, ViewChild, ElementRef, OnChanges, OnDestroy, Input, SimpleChanges,
    Renderer2} from '@angular/core';
import * as THREE from 'three';
import {Viewer3D} from '../../core/3d/viewer-3d';
import {Object3DViewerControls, Object3DViewerAction} from './object-3d-viewer-controls';
import {MeshLoader} from '../../core/3d/mesh-loader';
import {MeshPreparationUtility} from '../../core/3d/mesh-preparation-utility';
import {IdaiField3DDocument} from '../../core/model/idai-field-3d-document';
import {Object3DViewerCameraManager} from './object-3d-viewer-camera-manager';


@Component({
    moduleId: module.id,
    selector: 'object-3d-viewer',
    templateUrl: './object-3d-viewer.html'
})
/**
 * @author Thomas Kleinke
 */
export class Object3DViewerComponent implements OnChanges, OnDestroy {

    @Input() document: IdaiField3DDocument;

    @ViewChild('container') container: ElementRef;

    public textured: boolean = true;

    private viewer: Viewer3D;
    private controls: Object3DViewerControls;
    private cameraManager: Object3DViewerCameraManager;

    private mesh: THREE.Mesh;
    private meshMaterial: THREE.Material|Array<THREE.Material>;


    constructor(private renderer: Renderer2,
                private meshLoader: MeshLoader) {}


    public onMouseDown = (event: MouseEvent) => this.controls.onMouseDown(event);
    public onWheel = (event: WheelEvent) => this.controls.onWheel(event);

    public zoomIn = () => this.controls.zoomIn();
    public zoomOut = () => this.controls.zoomOut();


    async ngOnChanges(changes: SimpleChanges) {

        if (!this.viewer) this.initialize();
        if (this.isDocumentChanged(changes)) await this.update();
    }


    ngOnDestroy() {

        this.viewer.destroy();
    }


    public isCurrentAction(action: Object3DViewerAction) {

        return this.controls.getCurrentAction() == action;
    }


    public toggleTexture() {

        if (this.textured) {
            MeshPreparationUtility.setWhiteMaterial(this.mesh);
        } else {
            this.mesh.material = this.meshMaterial;
        }

        this.textured = !this.textured;
    }


    public focusMesh() {

        this.controls.resetRotation();
        this.cameraManager.focusMesh(this.mesh);
    }


    private initialize() {

        this.cameraManager = new Object3DViewerCameraManager();
        this.viewer = new Viewer3D(this.container.nativeElement, this.cameraManager);
        this.controls = new Object3DViewerControls(this.cameraManager);

        this.listenToMouseEvents();
    }


    private listenToMouseEvents() {

        this.renderer.listen(
            'document',
            'mousemove',
            (event: MouseEvent) => this.controls.onMouseMove(event)
        );

        this.renderer.listen(
            'document',
            'mouseup',
            (event: MouseEvent) => this.controls.onMouseUp(event)
        );
    }


    private async update() {

        this.viewer.removeAll();
        await this.loadMesh();

        this.viewer.add(this.mesh);
        this.controls.setMesh(this.mesh);
    }


    private async loadMesh(): Promise<void> {

        this.mesh = await this.meshLoader.load(this.document.resource.id as string);
        this.meshMaterial = this.mesh.material;
        MeshPreparationUtility.createBackSide(this.mesh);
    }


    private isDocumentChanged(changes: SimpleChanges): boolean {

        return !changes['document'].previousValue
            || changes['document'].previousValue.resource.id != this.document.resource.id;
    }
}