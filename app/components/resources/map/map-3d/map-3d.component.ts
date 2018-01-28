import {Component, ViewChild, ElementRef, OnChanges, OnDestroy, Input, Output, EventEmitter, SimpleChanges}
    from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Map3DControls} from './map-3d-controls';
import {Map3DControlState} from './map-3d-control-state';
import {Map3D} from './map-3d';
import {ObjectManager} from './object-manager';
import {SettingsService} from '../../../../core/settings/settings-service';


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

    @Output() onSelectDocument: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();

    @ViewChild('sceneContainer') sceneContainer: ElementRef;

    private map: Map3D;
    private controls: Map3DControls;
    private objectManager: ObjectManager;

    private controlState: Map3DControlState;


    constructor(private settingsService: SettingsService) {}


    public onMouseDown = (event: MouseEvent) => this.setControlState(this.controls.onMouseDown(event));
    public onMouseUp = (event: MouseEvent) => this.setControlState(this.controls.onMouseUp(event));
    public onMouseMove = (event: MouseEvent) => this.setControlState(this.controls.onMouseMove(event));
    public onWheel = (event: WheelEvent) => this.controls.onWheel(event);


    async ngOnChanges(changes: SimpleChanges) {

        if (!this.map) this.initialize();

        if (changes['documents']) await this.objectManager.show3DObjectsForDocuments(this.documents);
        if (changes['selectedDocument']) this.controls.setSelectedDocument(this.selectedDocument);
    }


    ngOnDestroy() {

        this.map.destroy();
    }


    private initialize() {

        this.map = new Map3D(this.sceneContainer.nativeElement);
        this.objectManager = new ObjectManager(this.map, this.settingsService);
        this.controls = new Map3DControls(this.map, this.objectManager);
    }


    private setControlState(controlState: Map3DControlState) {

        if (controlState.selectedDocument != this.selectedDocument) {
            this.onSelectDocument.emit(controlState.selectedDocument);
        }

        this.controlState = controlState;
    }
}