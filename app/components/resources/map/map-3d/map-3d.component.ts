import {Component, ViewChild, ElementRef, OnChanges, OnDestroy, Input, Output, EventEmitter, SimpleChanges}
    from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {Map3DControls} from './map-3d-controls';
import {Map3DControlState} from './map-3d-control-state';
import {Viewer3D} from '../../../../core/3d/viewer-3d';
import {MeshGeometryManager} from './geometries/mesh-geometry-manager';


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

    public meshGeometryManager: MeshGeometryManager;
    public controlState: Map3DControlState;

    private viewer: Viewer3D;
    private controls: Map3DControls;


    constructor(private projectConfiguration: ProjectConfiguration) {}


    public select = (document: IdaiFieldDocument|undefined) => this.onSelectDocument.emit(document);
    public getViewer = () => this.viewer;
    public getControls = () => this.controls;

    public onMouseDown = (event: MouseEvent) => this.setControlState(this.controls.onMouseDown(event));
    public onMouseUp = (event: MouseEvent) => this.setControlState(this.controls.onMouseUp(event));
    public onMouseMove = (event: MouseEvent) => this.setControlState(this.controls.onMouseMove(event));
    public onWheel = (event: WheelEvent) => this.controls.onWheel(event);

    public zoomIn = () => this.controls.zoomIn();
    public zoomOut = () => this.controls.zoomOut();

    public recreateLineGeometries = () => this.meshGeometryManager.recreateLineGeometries();


    async ngOnChanges(changes: SimpleChanges) {

        if (!this.viewer) this.initialize();

        if (changes['selectedDocument']) this.controls.setSelectedDocument(this.selectedDocument);
    }


    ngOnDestroy() {

        this.viewer.destroy();
    }


    private initialize() {

        this.viewer = new Viewer3D(this.container.nativeElement, true);
        this.meshGeometryManager = new MeshGeometryManager(this.viewer, this.projectConfiguration);
        this.controls = new Map3DControls(this.viewer, this.meshGeometryManager);
    }


    private setControlState(controlState: Map3DControlState) {

        if (controlState.selectedDocument != this.selectedDocument) {
            this.select(this.controlState.selectedDocument);
        }

        this.controlState = controlState;
    }
}