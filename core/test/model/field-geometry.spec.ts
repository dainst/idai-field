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


    it('determine if a geometry has z values', () => {

        const geometry: FieldGeometry = {
            type: 'MultiPolygon',
            coordinates: [
                [[[-7.0, -5.0, 2.0], [-6.0, -5.0, 3.0], [7.0, -7.0, 2.5]]],
                [[[7.0, 5.0, 1.5], [6.0, 5.0, 2.5], [-7.0, 7.0, 1.0]]]
            ]
        };

        const geometry2: FieldGeometry = {
            type: 'Point',
            coordinates: [
                [1.0, -2.0, 3.5]
            ]
        };

        const geometry3: FieldGeometry = {
            type: 'MultiPolygon',
            coordinates: [
                [[[-7.0, -5.0], [-6.0, -5.0], [7.0, -7.0]]],
                [[[7.0, 5.0], [6.0, 5.0], [-7.0, 7.0]]]
            ]
        };

        const geometry4: FieldGeometry = {
            type: 'Point',
            coordinates: [
                [1.0, -2.0]
            ]
        };

        expect(FieldGeometry.hasZValues(geometry)).toBe(true);
        expect(FieldGeometry.hasZValues(geometry2)).toBe(true);
        expect(FieldGeometry.hasZValues(geometry3)).toBe(false);
        expect(FieldGeometry.hasZValues(geometry4)).toBe(false);
    });
});
