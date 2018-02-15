import {Component, ViewChild, ElementRef, OnChanges, OnDestroy, Input, Output, EventEmitter, SimpleChanges}
    from '@angular/core';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Map3DControls} from './map-3d-controls';
import {Map3DControlState} from './map-3d-control-state';
import {Viewer3D} from '../../../../core/3d/viewer-3d';
import {Map3DMeshManager} from './map-3d-mesh-manager';
import {SettingsService} from '../../../../core/settings/settings-service';
import {Layer3DManager} from './layer-3d-manager';
import {ListDiffResult} from '../layer-manager';


@Component({
    moduleId: module.id,
    selector: 'map-3d',
    templateUrl: './map-3d.html'
})
/**
 * @author Thomas Kleinke
 */
export class Map3DComponent implements OnChanges, OnDestroy {

    @Input() documents: Array<IdaiFieldDocument>;
    @Input() selectedDocument: IdaiFieldDocument;
    @Input() mainTypeDocument: IdaiFieldDocument;

    @Output() onSelectDocument: EventEmitter<IdaiFieldDocument|undefined>
        = new EventEmitter<IdaiFieldDocument|undefined>();

    @ViewChild('container') container: ElementRef;

    private viewer: Viewer3D;
    private controls: Map3DControls;
    private meshManager: Map3DMeshManager;

    private controlState: Map3DControlState;

    public layers: Array<Document> = [];


    constructor(private settingsService: SettingsService,
                private layerManager: Layer3DManager) {

        this.layerManager.reset();
    }


    public select = (document: IdaiFieldDocument|undefined) => this.onSelectDocument.emit(document);
    public getViewer = () => this.viewer;

    public onMouseDown = (event: MouseEvent) => this.setControlState(this.controls.onMouseDown(event));
    public onMouseUp = (event: MouseEvent) => this.setControlState(this.controls.onMouseUp(event));
    public onMouseMove = (event: MouseEvent) => this.setControlState(this.controls.onMouseMove(event));
    public onWheel = (event: WheelEvent) => this.controls.onWheel(event);


    async ngOnChanges(changes: SimpleChanges) {

        if (!this.viewer) this.initialize();

        if (changes['selectedDocument']) this.controls.setSelectedDocument(this.selectedDocument);
        if (changes['mainTypeDocument']) await this.updateLayers();
    }


    ngOnDestroy() {

        this.viewer.destroy();
    }


    public async toggleLayer(layer: Document) {

        const id: string = layer.resource.id as string;

        this.layerManager.toggleLayer(id, this.mainTypeDocument);

        if (this.layerManager.isActiveLayer(id as string)) {
            await this.meshManager.addMesh(id);
        } else {
            this.meshManager.removeMesh(id);
        }
    }


    public focusLayer(layer: Document) {

        const mesh: THREE.Mesh = this.meshManager.getMesh(layer.resource.id as string) as THREE.Mesh;
        this.controls.focusMesh(mesh);
    }


    private initialize() {

        this.viewer = new Viewer3D(this.container.nativeElement);
        this.meshManager = new Map3DMeshManager(this.viewer, this.settingsService);
        this.controls = new Map3DControls(this.viewer);
    }


    private async updateLayers() {

        const { layers, activeLayersChange }
            = await this.layerManager.initializeLayers(this.mainTypeDocument);

        this.layers = layers;
        this.handleActiveLayersChange(activeLayersChange);
    }


    private handleActiveLayersChange(change: ListDiffResult) {

        change.removed.forEach(layerId => this.meshManager.removeMesh(layerId));
        change.added.forEach(layerId => this.meshManager.addMesh(layerId));
    }


    private setControlState(controlState: Map3DControlState) {

        if (controlState.selectedDocument != this.selectedDocument) {
            this.select(this.controlState.selectedDocument);
        }

        this.controlState = controlState;
    }
}