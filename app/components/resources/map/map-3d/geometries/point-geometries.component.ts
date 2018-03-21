import * as THREE from 'three';
import {Component, ViewChild, ElementRef, Input, Output, EventEmitter} from '@angular/core';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Map3DComponent} from '../map-3d.component';
import {DepthMap} from '../../../../../core/3d/depth-map';
import {VisibilityHelper} from '../../../../../core/3d/visibility-helper';
import {has3DPointGeometry, getPointVector} from '../../../../../util/util-3d';


export interface Map3DMarker {

    document: IdaiFieldDocument;
    canvasPosition: THREE.Vector2;
    worldSpacePosition: THREE.Vector3;
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

        const { canvasPosition, worldSpacePosition } = this.getPositionVectors(document);

        if (!canvasPosition || !worldSpacePosition) return undefined;

        const marker = this.cachedMarkers[document.resource.id as string] || { document: document };
        marker.canvasPosition = canvasPosition;
        marker.worldSpacePosition = worldSpacePosition;
        marker.visible = this.isVisible(marker);

        this.cachedMarkers[document.resource.id as string] = marker;

        return marker;
    }


    private getPositionVectors(document: IdaiFieldDocument)
            : { canvasPosition?: THREE.Vector2, worldSpacePosition?: THREE.Vector3 } {

        if (!has3DPointGeometry(document)) return {};

        const worldSpacePosition: THREE.Vector3 = PointGeometriesComponent.getWorldSpacePosition(document);

        if (!this.isInViewFrustum(worldSpacePosition)) return {};

        return {
            canvasPosition: this.getCanvasPosition(document),
            worldSpacePosition: worldSpacePosition
        };
    }


    private createVisibilityHelper(): VisibilityHelper {

        return new VisibilityHelper(
            this.map3DComponent.getViewer().getDepthMap() as DepthMap,
            this.map3DComponent.getCameraManager().getCamera()
        );
    }


    private isInViewFrustum(position: THREE.Vector3) {

        return this.map3DComponent.getCameraManager().getMode() == 'orthographic'
            || this.visibilityHelper.isInCameraViewFrustum(position);
    }


    private isVisible(marker: Map3DMarker) {

        return this.map3DComponent.getCameraManager().getMode() == 'orthographic'
            || this.visibilityHelper.isVisible(marker.worldSpacePosition, marker.canvasPosition);
    }


    private getCanvasPosition(document: IdaiFieldDocument): THREE.Vector2 {

        return this.map3DComponent.getViewer().getCanvasCoordinates(
            getPointVector((document.resource.geometry as IdaiFieldGeometry).coordinates)
        );
    }


    private static getWorldSpacePosition(document: IdaiFieldDocument): THREE.Vector3 {

        return getPointVector(
            (document.resource.geometry as IdaiFieldGeometry).coordinates
        );
    }
}