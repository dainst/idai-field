import * as THREE from 'three';
import {Component, ViewChild, ElementRef, Input, Output, EventEmitter} from '@angular/core';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Viewer3D} from '../../../../core/3d/viewer-3d';


export interface Map3DMarker {

    document: IdaiFieldDocument;
    xPosition: number;
    yPosition: number;
}


@Component({
    moduleId: module.id,
    selector: 'map-3d-point-geometries',
    templateUrl: './map-3d-point-geometries.html'
})
/**
 * @author Thomas Kleinke
 */
export class Map3DPointGeometriesComponent {

    @Input() viewer: Viewer3D;
    @Input() documents: Array<IdaiFieldDocument>;
    @Input() selectedDocument: IdaiFieldDocument;

    @Output() onSelectDocument: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();

    private markers: { [resourceId: string]: Map3DMarker } = {};

    @ViewChild('container') container: ElementRef;


    public select = (document: IdaiFieldDocument) => this.onSelectDocument.emit(document);


    public getMarkers(): Array<Map3DMarker> {

        const markers: Array<any> = [];

        this.documents.forEach(document => {
           const marker: Map3DMarker|undefined = this.createMarker(document);
           if (marker) {
               this.markers[document.resource.id as string] = marker;
               markers.push(marker);
           }
        });

        return markers;
    }


    private createMarker(document: IdaiFieldDocument): Map3DMarker|undefined {

        if (!Map3DPointGeometriesComponent.has3DPointGeometry(document)) return undefined;

        const screenCoordinates: THREE.Vector2|undefined = this.getScreenCoordinates(document);
        if (!screenCoordinates) return;

        const marker = this.markers[document.resource.id as string] || { document: document };
        marker.xPosition = screenCoordinates.x;
        marker.yPosition = screenCoordinates.y;
        return marker;
    }


    private getScreenCoordinates(document: IdaiFieldDocument): THREE.Vector2|undefined {

        return this.viewer.getScreenCoordinates(
            Map3DPointGeometriesComponent.getGeometryCoordinatesVector(document.resource.geometry as IdaiFieldGeometry)
        );
    }


    private static has3DPointGeometry(document: IdaiFieldDocument): boolean {

        return document.resource.geometry != undefined &&
            document.resource.geometry.type == 'Point' &&
            document.resource.geometry.coordinates != undefined &&
            document.resource.geometry.coordinates.length == 3;
    }


    private static getGeometryCoordinatesVector(geometry: IdaiFieldGeometry): THREE.Vector3 {

        return new THREE.Vector3(geometry.coordinates[0], geometry.coordinates[2], geometry.coordinates[1]);
    }
}