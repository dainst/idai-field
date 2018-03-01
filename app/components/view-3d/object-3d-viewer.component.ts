import {Component, ViewChild, ElementRef, OnChanges, OnDestroy, Input, SimpleChanges} from '@angular/core';
import * as THREE from 'three';
import {Document} from 'idai-components-2/core';
import {Viewer3D} from '../../core/3d/viewer-3d';
import {Object3DViewerControls} from './object-3d-viewer-controls';
import {MeshLoader} from '../../core/3d/mesh-loader';
import {MeshEditingUtility} from '../../core/3d/mesh-editing-utility';


@Component({
    moduleId: module.id,
    selector: 'object-3d-viewer',
    templateUrl: './object-3d-viewer.html'
})
/**
 * @author Thomas Kleinke
 */
export class Object3DViewerComponent implements OnChanges, OnDestroy {

    @Input() document: Document;

    @ViewChild('container') container: ElementRef;

    public textured: boolean = true;

    private viewer: Viewer3D;
    private controls: Object3DViewerControls;

    private mesh: THREE.Mesh;
    private meshMaterial: THREE.Material|Array<THREE.Material>;


    constructor(private meshLoader: MeshLoader) {}


    public onMouseDown = (event: MouseEvent) => this.controls.onMouseDown(event);
    public onMouseUp = (event: MouseEvent) => this.controls.onMouseUp(event);
    public onMouseMove = (event: MouseEvent) => this.controls.onMouseMove(event);
    public onWheel = (event: WheelEvent) => this.controls.onWheel(event);


    async ngOnChanges(changes: SimpleChanges) {

        if (!this.viewer) this.initialize();
        if (this.isDocumentChanged(changes)) await this.update();
    }


    ngOnDestroy() {

        this.viewer.destroy();
    }


    public isCurrentAction(action: string) {

        return this.controls.getCurrentAction() == action;
    }


    public toggleTexture() {

        if (this.textured) {
            MeshEditingUtility.setWhiteMaterial(this.mesh);
        } else {
            this.mesh.material = this.meshMaterial;
        }

        this.textured = !this.textured;
    }


    public focusMesh() {

        this.controls.resetRotation();
        this.controls.focusMesh();
    }


    private initialize() {

        this.viewer = new Viewer3D(this.container.nativeElement);
        this.controls = new Object3DViewerControls(this.viewer);
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
        MeshEditingUtility.createBackSide(this.mesh);
    }


    private isDocumentChanged(changes: SimpleChanges): boolean {

        return !changes['document'].previousValue
            || changes['document'].previousValue.resource.id != this.document.resource.id;
    }
}