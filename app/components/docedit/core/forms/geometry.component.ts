import {Component, Input, OnChanges} from '@angular/core';
import {Resource} from 'idai-components-2';


type GeometryType = 'Point'|'MultiPoint'|'LineString'|'MultiLineString'|'Polygon'|'MultiPolygon';


@Component({
    moduleId: module.id,
    selector: 'dai-geometry',
    templateUrl: './geometry.html'
})
/**
 * @author Thomas Kleinke
 */
export class GeometryComponent implements OnChanges {

    @Input() resource: Resource;

    public coordinates: string;


    ngOnChanges() {

        this.updateCoordinates();
    }


    public setGeometryType(type: ''|GeometryType) {

        if (!this.resource.geometry) {
            this.resource.geometry = { type: type, coordinates: [] };
        } else {
            this.resource.geometry.type = type;
        }
    }


    public updateCoordinates() {

        this.coordinates = this.resource.geometry
            ? JSON.stringify(this.resource.geometry.coordinates)
            : '';
    }


    public setCoordinates(coordinates: string) {

        try {
            this.resource.geometry.coordinates = JSON.parse(coordinates);
        } catch(err) {
            // Do nothing
        }

        this.updateCoordinates();
    }
}