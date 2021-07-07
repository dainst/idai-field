import { getTileLayerExtent, getResolutions } from './tileLayer';
import { mdiFormatLetterCase } from '@mdi/js';

const DOC1 = {
    resource: {
        category: 'Image',
        georeference: {
            topRightCoordinates: [
                3467001.490961519,
                563501.461761519
            ],
            topLeftCoordinates: [
                3467001.490961519,
                562998.5089384811
            ],
            bottomLeftCoordinates: [
                3466498.5381384813,
                562998.5089384811
            ]
        },
        groups: [
            {
                name: 'stem'
            },
            {
                name: 'parent',
                fields: [
                    { value: 8000, name: 'height' },
                    { value: 8000, name: 'width' },
                ]
            }
        ]
    }
};

const DOC2 = {
    resource: {
        category: 'Image',
        georeference: {
            topRightCoordinates: [
                3466499.9282666664,
                564999.9050666668
            ],
            topLeftCoordinates: [
                3466499.9282666664,
                564500.0717333334
            ],
            bottomLeftCoordinates: [
                3466000.094933333,
                564500.0717333334
            ]
        },
        groups: [
            {
                name: 'stem'
            },
            {
                name: 'parent',
                fields: [
                    { value: 3000, name: 'height' },
                    { value: 3000, name: 'width' },
                ]
            }
        ]
    }
};


test('get tile layer extent', () => {

    let extent = getTileLayerExtent(DOC1);

    expect(extent).toStrictEqual(
        // [ 562998.477499999804, 3466498.50669999979, 563501.493200000143, 3467001.52240000013 ]
        [ 562998.5089384811, 3466498.5381384813, 563501.461761519, 3467001.490961519 ]
    );

    extent = getTileLayerExtent(DOC2);

    expect(extent).toStrictEqual(
        [ 564500.0717333334, 3466000.094933333, 564999.9050666668, 3466499.9282666664 ]
    );
    
});


test('get tile layer resolutions', () => {

    let extent = getTileLayerExtent(DOC1);
    let resolutions = getResolutions(extent, 256, DOC1);

    expect(resolutions).toStrictEqual(
        // [ 2.0120628000014551, 1.00603140000072755, 0.503015700000363775, 0.251507850000181887,
        //    0.125753925000090944, 0.0628769625000454718 ]
        [ 2.011811292151455, 1.0059056460757274, 0.5029528230378637, 0.25147641151893185,
            0.12573820575946593, 0.06286910287973296 ]
    );

    extent = getTileLayerExtent(DOC2);
    resolutions = getResolutions(extent, 256, DOC2);

    expect(resolutions).toStrictEqual(
        [ 2.6657777777779845, 1.3328888888889923, 0.6664444444444961, 0.33322222222224807, 0.16661111111112403 ]
    );

});
