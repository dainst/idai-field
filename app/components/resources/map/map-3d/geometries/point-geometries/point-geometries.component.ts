import * as THREE from 'three';
import {Component, ViewChild, ElementRef, Input, Output, EventEmitter, DoCheck, OnChanges,
    SimpleChanges} from '@angular/core';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Map3DComponent} from '../../map-3d.component';
import {DepthMap} from '../../../../../core-3d/helpers/depth-map';
import {VisibilityHelper} from '../../../../../core-3d/helpers/visibility-helper';
import {has3DPointGeometry, getPointVector} from '../../../../../../util/util-3d';


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
export class PointGeometriesComponent implements DoCheck, OnChanges {

    @Input() documents: Array<IdaiFieldDocument>;
    @Input() selectedDocument: IdaiFieldDocument;

    @Output() onSelectDocument: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();

    @ViewChild('container') container: ElementRef;

    public showMarkers: boolean = true;

    private cachedMarkers: { [resourceId: string]: Map3DMarker } = {};

    private visibilityTestCounter: number = -1;


    constructor(private map3DComponent: Map3DComponent) {}


    public select = (document: IdaiFieldDocument) => this.onSelectDocument.emit(document);
    public isSelected = (document: IdaiFieldDocument) => this.selectedDocument == document;

    public onWheel = (event: WheelEvent) => this.map3DComponent.onWheel(event);


    public ngDoCheck() {

        this.increaseVisibilityTestCounter();
    }


    public ngOnChanges(changes: SimpleChanges) {

        if (changes['documents']) this.updateGeometriesBounds();
    }


    public getMarkers(): Array<Map3DMarker> {

        const markers: Array<Map3DMarker> = [];

        if (!this.documents || !this.showMarkers) return markers;

        PointGeometriesComponent.get3DPointGeometries(this.documents).forEach(document => {
           const marker: Map3DMarker|undefined = this.getMarker(document);
           if (marker) markers.push(marker);
        });

        this.performVisibilityTest(markers);

        return markers;
    }


    public toggleMarkers() {

        this.showMarkers = !this.showMarkers;
    }


    private getMarker(document: IdaiFieldDocument): Map3DMarker|undefined {

        const { canvasPosition, worldSpacePosition } = this.getPositionVectors(document);

        if (!canvasPosition || !worldSpacePosition) return undefined;

        const cachedMarker: Map3DMarker|undefined = this.cachedMarkers[document.resource.id as string];

        if (cachedMarker) {
            PointGeometriesComponent.updateMarker(cachedMarker, canvasPosition, worldSpacePosition);
            return cachedMarker;
        } else {
            return this.createMarker(document, canvasPosition, worldSpacePosition);
        }
    }


    private createMarker(document: IdaiFieldDocument, canvasPosition: THREE.Vector2,
                         worldSpacePosition: THREE.Vector3): Map3DMarker|undefined {

        const marker: Map3DMarker = {
            document: document,
            canvasPosition: canvasPosition,
            worldSpacePosition: worldSpacePosition,
            visible: true
        };

        this.cachedMarkers[document.resource.id as string] = marker;

        return marker;
    }


    private getPositionVectors(document: IdaiFieldDocument)
            : { canvasPosition?: THREE.Vector2, worldSpacePosition?: THREE.Vector3 } {

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
            this.map3DComponent.getCameraManager().getCamera().clone()
        );
    }


    private increaseVisibilityTestCounter() {

        if (this.visibilityTestCounter > 100000) {
            this.visibilityTestCounter = 0;
        } else {
            this.visibilityTestCounter++;
        }
    }


    /**
     * Only one marker per Angular change detection run is tested for visibility in order to avoid
     * performance issues.
     */
    private performVisibilityTest(markers: Array<Map3DMarker>) {

        if (markers.length == 0) return;

        const index: number = this.visibilityTestCounter % markers.length;
        markers[index].visible = this.isVisible(markers[index]);
    }


    private isVisible(marker: Map3DMarker) {

        if (this.map3DComponent.getCameraManager().getProjectionMode() == 'orthographic') return true;

        return VisibilityHelper.isVisible(
            marker.worldSpacePosition,
            marker.canvasPosition,
            this.map3DComponent.getCameraManager().getCamera().clone(),
            this.map3DComponent.getViewer().getDepthMap() as DepthMap
        );
    }


    private updateGeometriesBounds() {

        this.map3DComponent.getGeometriesBounds().setPoints(
            PointGeometriesComponent.get3DPointGeometries(this.documents).map(document => {
                return PointGeometriesComponent.getWorldSpacePosition(document);
            })
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


    private static get3DPointGeometries(documents: Array<IdaiFieldDocument>): Array<IdaiFieldDocument> {

        return documents.filter(document => has3DPointGeometry(document));
    }


    private static updateMarker(marker: Map3DMarker, canvasPosition: THREE.Vector2,
                                worldSpacePosition: THREE.Vector3) {

        marker.canvasPosition = canvasPosition;
        marker.worldSpacePosition = worldSpacePosition;
    }
}