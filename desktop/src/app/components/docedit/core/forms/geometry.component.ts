import { Component, Input, OnChanges } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { Resource } from 'idai-field-core';


type GeometryType = 'Point'|'MultiPoint'|'LineString'|'MultiLineString'|'Polygon'|'MultiPolygon';


@Component({
    selector: 'form-field-geometry',
    templateUrl: './geometry.html'
})
/**
 * @author Thomas Kleinke
 */
export class GeometryComponent implements OnChanges {

    @Input() resource: Resource;

    public coordinates: string;
    public edit: boolean;


    constructor(private i18n: I18n) {}


    ngOnChanges() {

        this.resetCoordinates();
    }


    public getGeometryTypeLabel(): string {

        if (!this.resource.geometry) return this.i18n({ id: 'geometry.none', value: 'Keine Geometrie'});

        switch(this.resource.geometry.type) {
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

        if (!this.resource.geometry) {
            this.resource.geometry = { type: type, coordinates: [] };
        }  else if (type === '') {
            delete this.resource.geometry;
        } else {
            this.resource.geometry.type = type;
        }

        this.parseCoordinates(false);
    }


    public resetCoordinates() {

        this.coordinates = this.resource.geometry
            ? JSON.stringify(this.resource.geometry.coordinates, undefined, 4)
            : '';
    }


    public parseCoordinates(resetIfInvalid: boolean) {

        try {
            this.resource.geometry.coordinates = JSON.parse(this.coordinates);
        } catch(err) {
            // Do nothing
            if (resetIfInvalid) this.resetCoordinates();
        }
    }
}
