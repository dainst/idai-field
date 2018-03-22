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


    constructor(private map3DComponent: Map3DComponent) {}


    public select = (document: IdaiFieldDocument) => this.onSelectDocument.emit(document);

    public onWheel = (event: WheelEvent) => this.map3DComponent.onWheel(event);


    public getMarkers(): Array<Map3DMarker> {

        const markers: Array<any> = [];

        if (!this.documents || !this.showMarkers) return markers;

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


    private isInViewFrustum(position: THREE.Vector3) {

        return VisibilityHelper.isInCameraViewFrustum(
            position,
            this.map3DComponent.getCameraManager().getCamera()
        );
    }


    private isVisible(marker: Map3DMarker) {

        if (this.map3DComponent.getCameraManager().getMode() == 'orthographic') return true;

        return VisibilityHelper.isVisible(
            marker.worldSpacePosition,
            marker.canvasPosition,
            this.map3DComponent.getCameraManager().getCamera(),
            this.map3DComponent.getViewer().getDepthMap() as DepthMap
        );
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