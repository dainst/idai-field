import { Component, Input, OnChanges } from '@angular/core';


type GeometryType = 'Point'|'MultiPoint'|'LineString'|'MultiLineString'|'Polygon'|'MultiPolygon';


@Component({
    selector: 'form-field-geometry',
    templateUrl: './geometry.html'
})
/**
 * @author Thomas Kleinke
 */
export class GeometryComponent implements OnChanges {

    @Input() fieldContainer: any;

    public coordinates: string;
    public edit: boolean;


    constructor() {}


    ngOnChanges() {

        this.resetCoordinates();
    }


    public getGeometryTypeLabel(): string {

        if (!this.fieldContainer.geometry) return $localize `:@@geometry.none:Keine Geometrie`;

        switch(this.fieldContainer.geometry.type) {
            case 'Point':
                return $localize `:@@geometry.point:Punkt`;
            case 'MultiPoint':
                return $localize `:@@geometry.multiPoint:Multipunkt`;
            case 'LineString':
                return $localize `:@@geometry.polyline:Polyline`;
            case 'MultiLineString':
                return $localize `:@@geometry.multiPolyline:Multipolyline`;
            case 'Polygon':
                return $localize `:@@geometry.polygon:Polygon`;
            case 'MultiPolygon':
                return $localize `:@@geometry.multiPolygon:Multipolygon`;
            default:
                return '';
        }
    }


    public setGeometryType(type: ''|GeometryType) {

        if (!this.fieldContainer.geometry) {
            this.fieldContainer.geometry = { type: type, coordinates: [] };
        }  else if (type === '') {
            delete this.fieldContainer.geometry;
        } else {
            this.fieldContainer.geometry.type = type;
        }

        this.parseCoordinates(false);
    }


    public resetCoordinates() {

        this.coordinates = this.fieldContainer.geometry
            ? JSON.stringify(this.fieldContainer.geometry.coordinates, undefined, 4)
            : '';
    }


    public parseCoordinates(resetIfInvalid: boolean) {

        try {
            this.fieldContainer.geometry.coordinates = JSON.parse(this.coordinates);
        } catch(err) {
            // Do nothing
            if (resetIfInvalid) this.resetCoordinates();
        }
    }
}
