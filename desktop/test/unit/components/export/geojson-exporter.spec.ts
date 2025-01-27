import { featureDoc } from 'idai-field-core';
import { GeoJsonExporter } from '../../../../src/app/components/export/geojson-exporter';

const fs = require('fs');
const rimraf = require('rimraf');
const geojsonHint = require('@mapbox/geojsonhint');


/**
 * @author Thomas Kleinke
 */
describe('GeojsonExporter', () => {

    const exportFilePath: string = process.cwd() + '/test/store/test.geojson';

    let mockDatastore: any;


    const performExportAndValidate = async () => {

        await GeoJsonExporter.performExport(mockDatastore, exportFilePath, 'project');
        const geojson: any = fs.readFileSync(exportFilePath).toString();
        expect(geojsonHint.hint(geojson, null)).toEqual([]);
    };


    beforeAll(() => {

        mockDatastore = {
            find: jest.fn()
        };
    });


    afterEach(done => {

        rimraf(exportFilePath, () => done());
    });


    test('create valid geojson file', async () => {

        const pointFeature = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');
        pointFeature.resource.geometry = {
            type: 'Point',
            coordinates: [1.0, 2.0]
        };

        const lineFeature = featureDoc('Feature 2', 'feature2', 'Feature', 'f2');
        lineFeature.resource.geometry = {
            type: 'LineString',
            coordinates: [[0.5, 1.5], [1.5, 2.5], [2.5, 3.5]]
        };

        mockDatastore.find.mockImplementation(() => {
            return { documents: [pointFeature, lineFeature] };
        });

        await performExportAndValidate();
    });


    test('close ring and fix winding order for polygon geometry', async () => {

        const polygonFeature = featureDoc('Feature 2', 'feature2', 'Feature', 'f2');
        polygonFeature.resource.geometry = {
            type: 'Polygon',
            coordinates: [[[1.0, 2.0], [2.0, 2.0], [2.0, 1.0], [1.0, 1.0]]]
        };

        mockDatastore.find.mockImplementation(() => {
            return { documents: [polygonFeature] };
        });

        await performExportAndValidate();
    });
});
