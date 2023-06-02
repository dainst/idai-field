import { Component, Input, OnChanges } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';


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


    constructor(private i18n: I18n) {}


    ngOnChanges() {

        this.resetCoordinates();
    }


    public getGeometryTypeLabel(): string {

        if (!this.fieldContainer.geometry) return this.i18n({ id: 'geometry.none', value: 'Keine Geometrie'});

        switch(this.fieldContainer.geometry.type) {
            case 'Point':
                return this.i18n({ id: 'geometry.point', value: 'Punkt'});
            case 'MultiPoint':
                return this.i18n({ id: 'geometry.multiPoint', value: 'Multipunkt'});
            case 'LineString':
                return this.i18n({ id: 'geometry.polyline', value: 'Polyline'});
            case 'MultiLineString':
                return this.i18n({ id: 'geometry.multiPolyline', value: 'Multipolyline'});
            case 'Polygon':
                return this.i18n({ id: 'geometry.polygon', value: 'Polygon'});
            case 'MultiPolygon':
                return this.i18n({ id: 'geometry.multiPolygon', value: 'Multipolygon'});
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
