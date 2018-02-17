import {Component, ViewChild, ElementRef, OnChanges, OnDestroy, Input, Output, EventEmitter, SimpleChanges}
    from '@angular/core';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {Map3DControls} from './map-3d-controls';
import {Map3DControlState} from './map-3d-control-state';
import {Viewer3D} from '../../../../core/3d/viewer-3d';
import {SettingsService} from '../../../../core/settings/settings-service';
import {Map3DLayerMeshManager} from './layers/map-3d-layer-mesh-manager';
import {Layer3DManager} from './layers/layer-3d-manager';
import {ListDiffResult} from '../layer-manager';
import {Map3DMeshGeometries} from './map-3d-mesh-geometries';


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
    private layerMeshManager: Map3DLayerMeshManager;
    private meshGeometries: Map3DMeshGeometries;

    private controlState: Map3DControlState;

    public layers: Array<Document> = [];


    constructor(private settingsService: SettingsService,
                private layerManager: Layer3DManager,
                private projectConfiguration: ProjectConfiguration) {

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
        if (changes['documents']) await this.updateGeometries();
    }


    ngOnDestroy() {

        this.viewer.destroy();
    }


    public async toggleLayer(layer: Document) {

        const id: string = layer.resource.id as string;

        this.layerManager.toggleLayer(id, this.mainTypeDocument);

        if (this.layerManager.isActiveLayer(id as string)) {
            await this.layerMeshManager.addMesh(id);
        } else {
            this.layerMeshManager.removeMesh(id);
        }
    }


    public focusLayer(layer: Document) {

        const mesh: THREE.Mesh = this.layerMeshManager.getMesh(layer.resource.id as string) as THREE.Mesh;
        this.controls.focusMesh(mesh);
    }


    private initialize() {

        this.viewer = new Viewer3D(this.container.nativeElement);
        this.layerMeshManager = new Map3DLayerMeshManager(this.viewer, this.settingsService);
        this.meshGeometries = new Map3DMeshGeometries(this.viewer, this.projectConfiguration);
        this.controls = new Map3DControls(this.viewer);
    }


    private async updateLayers() {

        const { layers, activeLayersChange }
            = await this.layerManager.initializeLayers(this.mainTypeDocument);

        this.layers = layers;
        this.handleActiveLayersChange(activeLayersChange);
    }


    private async updateGeometries() {

        await this.viewer.waitForSizeAdjustment();
        this.meshGeometries.showGeometries(this.documents);
    }


    private handleActiveLayersChange(change: ListDiffResult) {

        change.removed.forEach(layerId => this.layerMeshManager.removeMesh(layerId));
        change.added.forEach(layerId => this.layerMeshManager.addMesh(layerId));
    }


    private setControlState(controlState: Map3DControlState) {

        if (controlState.selectedDocument != this.selectedDocument) {
            this.select(this.controlState.selectedDocument);
        }

        this.controlState = controlState;
    }
}