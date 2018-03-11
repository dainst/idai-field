import * as THREE from 'three';
import {Component, ViewChild, ElementRef, Input, Output, EventEmitter} from '@angular/core';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Map3DComponent} from '../map-3d.component';
import {DepthMap} from '../../../../../core/3d/depth-map';
import {VisibilityHelper} from '../../../../../core/3d/visibility-helper';
import {has3DPointGeometry, getPointVector} from '../../../../../util/util-3d';


export interface Map3DMarker {

    document: IdaiFieldDocument;
    xPosition: number;
    yPosition: number;
    visible: boolean;
}


@Component({
    moduleId: module.id,
    selector: 'point-geometries',
    templateUrl: './point-geometries.html'
})
/**
 * @author Thomas Kleinke
 */
export class PointGeometriesComponent {

    @Input() documents: Array<IdaiFieldDocument>;
    @Input() selectedDocument: IdaiFieldDocument;

    @Output() onSelectDocument: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();

    @ViewChild('container') container: ElementRef;

    public showMarkers: boolean = true;

    private cachedMarkers: { [resourceId: string]: Map3DMarker } = {};

    private visibilityHelper: VisibilityHelper;


    constructor(private map3DComponent: Map3DComponent) {}


    public select = (document: IdaiFieldDocument) => this.onSelectDocument.emit(document);

    public onMouseMove = (event: MouseEvent) => this.map3DComponent.onMouseMove(event);
    public onMouseUp = (event: MouseEvent) => this.map3DComponent.onMouseUp(event);
    public onWheel = (event: WheelEvent) => this.map3DComponent.onWheel(event);


    public getMarkers(): Array<Map3DMarker> {

        const markers: Array<any> = [];

        if (!this.documents || !this.showMarkers) return markers;

        if (!this.visibilityHelper) this.visibilityHelper = this.createVisibilityHelper();

        this.documents.forEach(document => {
           const marker: Map3DMarker|undefined = this.createMarker(document);
           if (marker) markers.push(marker);
        });

        return markers;
    }


    public toggleMarkers() {

        this.showMarkers = !this.showMarkers;
    }


    private createMarker(document: IdaiFieldDocument): Map3DMarker|undefined {

        if (!has3DPointGeometry(document) || !this.isInCameraViewFrustum(document)) return undefined;

        const screenCoordinates: THREE.Vector2|undefined = this.getCanvasCoordinates(document);
        if (!screenCoordinates) return;

        const marker = this.cachedMarkers[document.resource.id as string] || { document: document };
        marker.xPosition = screenCoordinates.x;
        marker.yPosition = screenCoordinates.y;
        marker.visible = this.isVisible(marker);

        this.cachedMarkers[document.resource.id as string] = marker;

        return marker;
    }


    private isInCameraViewFrustum(document: IdaiFieldDocument): boolean {

        return this.visibilityHelper.isInCameraViewFrustum(
            PointGeometriesComponent.getWorldSpaceCoordinates(document)
        );
    }


    private isVisible(marker: Map3DMarker): boolean {

        const positionInWorldSpace: THREE.Vector3
            = PointGeometriesComponent.getWorldSpaceCoordinates(marker.document);
        const positionOnCanvas: THREE.Vector2 = new THREE.Vector2(marker.xPosition, marker.yPosition);

        return this.visibilityHelper.isVisible(positionInWorldSpace, positionOnCanvas);
    }


    private getCanvasCoordinates(document: IdaiFieldDocument): THREE.Vector2|undefined {

        return this.map3DComponent.getViewer().getCanvasCoordinates(
            getPointVector((document.resource.geometry as IdaiFieldGeometry).coordinates)
        );
    }


    private static getWorldSpaceCoordinates(document: IdaiFieldDocument): THREE.Vector3 {

        return getPointVector(
            (document.resource.geometry as IdaiFieldGeometry).coordinates
        );
    }


    private createVisibilityHelper(): VisibilityHelper {

        return new VisibilityHelper(
            this.map3DComponent.getViewer().getDepthMap() as DepthMap,
            this.map3DComponent.getViewer().getCamera()
        );
    }
}