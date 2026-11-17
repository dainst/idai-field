import { Component, Input, OnChanges } from '@angular/core';
import { Field, FieldGeometry, FieldGeometryType } from 'idai-field-core';
import { UtilTranslations } from '../../../../util/util-translations';


@Component({
    selector: 'form-field-geometry',
    templateUrl: './geometry.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class GeometryComponent implements OnChanges {

    @Input() fieldContainer: any;
    @Input() field: Field;

    public coordinates: string;
    public geometryTypes: Array<FieldGeometryType> = [];
    public edit: boolean;


    constructor(private utilTranslations: UtilTranslations) {}


    ngOnChanges() {

        this.resetCoordinates();
        this.geometryTypes = this.getGeometryTypes();
    }


    public getGeometryTypeLabel(geometryType: FieldGeometryType = this.fieldContainer.geometry?.type): string {

        return geometryType
            ? this.utilTranslations.getTranslation('geometry.' + geometryType)
            : $localize `:@@geometry.none:Keine Geometrie`;
    }


    public setGeometryType(type: ''|FieldGeometryType) {

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


    private getGeometryTypes(): Array<FieldGeometryType> {

        const geometryTypes: Array<FieldGeometryType> = FieldGeometry.getAvailableGeometryTypes();
        if (!this.field.geometryTypes) return geometryTypes;

        return geometryTypes.filter(geometryType => {
            return geometryType === this.fieldContainer.geometry?.type
                || this.field.geometryTypes.includes(geometryType);
        });
    }
}
