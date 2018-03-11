import * as THREE from 'three';
import {Component, ViewChild, ElementRef, Input, Output, EventEmitter} from '@angular/core';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Map3DComponent} from '../map-3d.component';
import {DepthMap} from '../../../../../core/3d/depth-map';
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


    constructor(private map3DComponent: Map3DComponent) {}


    public select = (document: IdaiFieldDocument) => this.onSelectDocument.emit(document);

    public onMouseMove = (event: MouseEvent) => this.map3DComponent.onMouseMove(event);
    public onMouseUp = (event: MouseEvent) => this.map3DComponent.onMouseUp(event);
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

        if (!has3DPointGeometry(document)) return undefined;

        const screenCoordinates: THREE.Vector2|undefined = this.getCanvasCoordinates(document);
        if (!screenCoordinates) return;

        const marker = this.cachedMarkers[document.resource.id as string] || { document: document };
        marker.xPosition = screenCoordinates.x;
        marker.yPosition = screenCoordinates.y;
        marker.visible = this.isVisible(marker);

        this.cachedMarkers[document.resource.id as string] = marker;

        return marker;
    }


    private isVisible(marker: Map3DMarker): boolean {

        const camera: THREE.PerspectiveCamera = this.map3DComponent.getViewer().getCamera().clone();

        const depthMap: DepthMap = this.map3DComponent.getViewer().getDepthMap() as DepthMap;

        const distanceToIntersection: number = depthMap.getDepth(
            new THREE.Vector2(marker.xPosition, marker.yPosition)
        );

        if (distanceToIntersection <= camera.near) return true;

        const markerPosition: THREE.Vector3 = getPointVector(
            (marker.document.resource.geometry as IdaiFieldGeometry).coordinates
        );

        const zeroPlane = new THREE.Plane(camera.getWorldDirection().normalize());

        const plane = new THREE.Plane(
            camera.getWorldDirection().normalize(),
            -zeroPlane.distanceToPoint(camera.position) - camera.near
        );

        const distanceToMarkerPosition: number = plane.distanceToPoint(markerPosition);

        if (distanceToIntersection > distanceToMarkerPosition) {
            return true;
        } else {
            return (distanceToMarkerPosition > 50 && (distanceToMarkerPosition - distanceToIntersection) < 1);
        }
    }


    private getCanvasCoordinates(document: IdaiFieldDocument): THREE.Vector2|undefined {

        return this.map3DComponent.getViewer().getCanvasCoordinates(
            getPointVector((document.resource.geometry as IdaiFieldGeometry).coordinates)
        );
    }
}