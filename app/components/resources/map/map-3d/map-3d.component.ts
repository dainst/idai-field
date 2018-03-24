import {
    Component, ViewChild, ElementRef, OnChanges, OnDestroy, Input, Output, EventEmitter, SimpleChanges,
    Renderer2
} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {Map3DControls} from './map-3d-controls';
import {Map3DControlState} from './map-3d-control-state';
import {Viewer3D} from '../../../../core/3d/viewer-3d';
import {MeshGeometryManager} from './geometries/mesh-geometry-manager';
import {Map3DCameraManager} from './map-3d-camera-manager';
import {IntersectionHelper} from '../../../../core/3d/intersection-helper';
import {SceneManager} from '../../../../core/3d/scene-manager';


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
    private cameraManager: Map3DCameraManager;
    private sceneManager: SceneManager;

    private removeMouseMoveEventListener: Function;
    private removeMouseUpEventListener: Function;


    constructor(private renderer: Renderer2,
                private projectConfiguration: ProjectConfiguration) {}


    public getViewer = () => this.viewer;
    public getControls = () => this.controls;
    public getCameraManager = () => this.cameraManager;
    public getSceneManager = () => this.sceneManager;

    public onMouseDown = (event: MouseEvent) => this.setControlState(this.controls.onMouseDown(event));
    public onWheel = (event: WheelEvent) => this.controls.onWheel(event);

    public zoomIn = () => this.controls.zoomIn();
    public zoomOut = () => this.controls.zoomOut();

    public select = (document: IdaiFieldDocument|undefined) => this.onSelectDocument.emit(document);

    public recreateLineGeometries = () => this.meshGeometryManager.recreateLineGeometries();


    async ngOnChanges(changes: SimpleChanges) {

        if (!this.viewer) this.initialize();

        if (changes['selectedDocument']) this.controls.setSelectedDocument(this.selectedDocument);
    }


    ngOnDestroy() {

        this.viewer.destroy();
        this.removeMouseMoveEventListener();
        this.removeMouseUpEventListener();
    }


    private initialize() {

        this.sceneManager = new SceneManager();
        this.cameraManager = new Map3DCameraManager(this.sceneManager);
        this.viewer = new Viewer3D(this.container.nativeElement, this.cameraManager, this.sceneManager, true);
        this.meshGeometryManager = new MeshGeometryManager(this.viewer, this.cameraManager, this.sceneManager,
            this.projectConfiguration);
        this.controls = new Map3DControls(this.cameraManager, this.meshGeometryManager,
            new IntersectionHelper(this.viewer, this.cameraManager));

        this.listenToMouseEvents();
    }


    private listenToMouseEvents() {

        this.removeMouseMoveEventListener = this.renderer.listen(
            'document',
            'mousemove',
            (event: MouseEvent) => this.setControlState(this.controls.onMouseMove(event))
        );

        this.removeMouseUpEventListener =this.renderer.listen(
            'document',
            'mouseup',
            (event: MouseEvent) => this.setControlState(this.controls.onMouseUp(event))
        );
    }


    private setControlState(controlState: Map3DControlState) {

        if (controlState.selectedDocument != this.selectedDocument) {
            this.select(this.controlState.selectedDocument);
        }

        this.controlState = controlState;
    }
}