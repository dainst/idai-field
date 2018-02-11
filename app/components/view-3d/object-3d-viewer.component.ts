import {Component, ViewChild, ElementRef, OnChanges, OnDestroy, Input, SimpleChanges} from '@angular/core';
import * as THREE from 'three';
import {Document} from 'idai-components-2/core';
import {Viewer3D} from '../../core/3d/viewer-3d';
import {SettingsService} from '../../core/settings/settings-service';
import {Object3DViewerControls} from './object-3d-viewer-controls';
import {MeshLoader} from '../../core/3d/mesh-loader';


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

    private viewer: Viewer3D;
    private controls: Object3DViewerControls;
    private meshLoader: MeshLoader;


    constructor(private settingsService: SettingsService) {}


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


    private initialize() {

        this.viewer = new Viewer3D(this.container.nativeElement);
        this.controls = new Object3DViewerControls(this.viewer);
        this.meshLoader = new MeshLoader(this.settingsService);
    }


    private async update() {

        this.viewer.removeAll();

        const mesh: THREE.Mesh = await this.meshLoader.load(this.document.resource.id as string);
        this.viewer.add(mesh);
        this.controls.setMesh(mesh);
    }


    private isDocumentChanged(changes: SimpleChanges): boolean {

        return !changes['document'].previousValue
            || changes['document'].previousValue.resource.id != this.document.resource.id;
    }
}