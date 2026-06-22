import { createGeoreferenceFromControlPoints, parseControlPoints } from
    '../../../../../src/app/components/image/georeference/control-point-georeference';


describe('control point georeference', () => {

    it('creates an ImageGeoreference from three affine control points', () => {

        const controlPointsJson = JSON.stringify([
            { image: { x: 0, y: 0 }, map: { x: 1000, y: 2000 }, label: 'top-left' },
            { image: { x: 99, y: 0 }, map: { x: 1099, y: 2000 }, label: 'top-right' },
            { image: { x: 0, y: 49 }, map: { x: 1000, y: 1951 }, label: 'bottom-left' }
        ]);

        const georeference = createGeoreferenceFromControlPoints(controlPointsJson, 100, 50);

        expect(georeference).toEqual({
            topLeftCoordinates: [2000, 1000],
            topRightCoordinates: [2000, 1099],
            bottomLeftCoordinates: [1951, 1000]
        });
    });


    it('ignores malformed control point entries', () => {

        const controlPoints = parseControlPoints(JSON.stringify([
            { image: { x: 0, y: 0 }, map: { x: 1000, y: 2000 } },
            { image: { x: 'bad', y: 0 }, map: { x: 1000, y: 2000 } }
        ]));

        expect(controlPoints.length).toBe(1);
    });


    it('does not create a georeference from fewer than three points', () => {

        const georeference = createGeoreferenceFromControlPoints(
            JSON.stringify([{ image: { x: 0, y: 0 }, map: { x: 1000, y: 2000 } }]),
            100,
            50
        );

        expect(georeference).toBeUndefined();
    });
});
