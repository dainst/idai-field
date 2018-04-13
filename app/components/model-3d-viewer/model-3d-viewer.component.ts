import {Component, ViewChild, ElementRef, OnChanges, OnDestroy, Input, SimpleChanges,
    Renderer2} from '@angular/core';
import * as THREE from 'three';
import {Viewer3D} from '../../core/3d/viewer-3d';
import {Model3DViewerControls, Model3DViewerAction} from './model-3d-viewer-controls';
import {MeshLoader} from '../../core/3d/mesh-loader';
import {IdaiField3DDocument} from '../../core/model/idai-field-3d-document';
import {Model3DViewerCameraManager} from './model-3d-viewer-camera-manager';
import {SceneManager} from '../../core/3d/scene-manager';


@Component({
    moduleId: module.id,
    selector: 'model-3d-viewer',
    templateUrl: './model-3d-viewer.html'
})
/**
 * @author Thomas Kleinke
 */
export class Model3DViewerComponent implements OnChanges, OnDestroy {

    @Input() document: IdaiField3DDocument;

    @ViewChild('container') container: ElementRef;

    private viewer: Viewer3D;
    private controls: Model3DViewerControls;
    private cameraManager: Model3DViewerCameraManager;
    private sceneManager: SceneManager;

    private mesh: THREE.Mesh;

    private removeMouseMoveEventListener: Function;
    private removeMouseUpEventListener: Function;


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
        this.removeMouseMoveEventListener();
        this.removeMouseUpEventListener();
    }


    public isCurrentAction(action: Model3DViewerAction) {

        return this.controls.getCurrentAction() == action;
    }


    public focusMesh() {

        this.controls.resetRotation();
        this.cameraManager.focusMesh(this.mesh);
    }


    private initialize() {

        this.cameraManager = new Model3DViewerCameraManager();
        this.sceneManager = new SceneManager();
        this.viewer = new Viewer3D(this.container.nativeElement, this.cameraManager, this.sceneManager);
        this.controls = new Model3DViewerControls(this.cameraManager);

        this.listenToMouseEvents();
    }


    private listenToMouseEvents() {

        this.removeMouseMoveEventListener = this.renderer.listen(
            'document',
            'mousemove',
            (event: MouseEvent) => this.controls.onMouseMove(event)
        );

        this.removeMouseUpEventListener = this.renderer.listen(
            'document',
            'mouseup',
            (event: MouseEvent) => this.controls.onMouseUp(event)
        );
    }


    private async update() {

        this.sceneManager.removeAll();
        await this.loadMesh();

        this.sceneManager.add(this.mesh);
        this.controls.setMesh(this.mesh);
    }


    private async loadMesh(): Promise<void> {

        this.mesh = await this.meshLoader.load(this.document.resource.id as string);
    }


    private isDocumentChanged(changes: SimpleChanges): boolean {

        return !changes['document'].previousValue
            || changes['document'].previousValue.resource.id != this.document.resource.id;
    }
}