import { FieldGeometry } from '../../src/model/document/field-geometry';


/**
 * @author Thomas Kleinke
 */
describe('FieldGeometry', () => {

    it('close multipolygon rings', () => {

        const geometry: FieldGeometry = {
            type: 'MultiPolygon',
            coordinates: [
                [[[-7.0, -5.0], [-6.0, -5.0], [7.0, -7.0]]],
                [[[7.0, 5.0], [6.0, 5.0], [-7.0, 7.0]]]
            ]
        };

        FieldGeometry.closeRings(geometry);

        expect(geometry.coordinates).toEqual([
            [[[-7.0, -5.0], [-6.0, -5.0], [7.0, -7.0], [-7.0, -5.0]]],
            [[[7.0, 5.0], [6.0, 5.0], [-7.0, 7.0], [7.0, 5.0]]]
        ]);
    });


    it('close polygon rings', () => {

        const geometry: FieldGeometry = {
            type: 'Polygon',
            coordinates: [[[-7.0, -5.0], [-6.0, -5.0], [7.0, -7.0]]]
        };

        FieldGeometry.closeRings(geometry);

        expect(geometry.coordinates).toEqual([[[-7.0, -5.0], [-6.0, -5.0], [7.0, -7.0], [-7.0, -5.0]]]);
    });


    it('do not change multipolygon rings if already closed', () => {

        const geometry: FieldGeometry = {
            type: 'MultiPolygon',
            coordinates: [
                [[[-7.0, -5.0], [-6.0, -5.0], [7.0, -7.0], [-7.0, -5.0]]],
                [[[7.0, 5.0], [6.0, 5.0], [-7.0, 7.0], [7.0, 5.0]]]
            ]
        };

        FieldGeometry.closeRings(geometry);

        expect(geometry.coordinates).toEqual([
            [[[-7.0, -5.0], [-6.0, -5.0], [7.0, -7.0], [-7.0, -5.0]]],
            [[[7.0, 5.0], [6.0, 5.0], [-7.0, 7.0], [7.0, 5.0]]]
        ]);
    });


    it('do not change polygon rings if already closed', () => {

        const geometry: FieldGeometry = {
            type: 'Polygon',
            coordinates: [[[-7.0, -5.0], [-6.0, -5.0], [7.0, -7.0], [-7.0, -5.0]]]
        };

        FieldGeometry.closeRings(geometry);

        expect(geometry.coordinates).toEqual([[[-7.0, -5.0], [-6.0, -5.0], [7.0, -7.0], [-7.0, -5.0]]]);
    });
});
