import {IdaiFieldDocument} from '../model/idai-field-document';

export var DOCS: IdaiFieldDocument[] = [
    {
        "resource": {
            "id": "tf1",
            "identifier": "testf1",
            "shortDescription": "Testfund",
            "relations": {},
            "geometry": {
                "type": "Point",
                "coordinates": [ 27.1892609283, 39.1411810096 ],
                "crs": "local"
            },
            "type": "object"
        },
        "synced": 0
    },
    {
        "resource": {
            "id": "o25",
            "identifier": "PE07-So-07_Z001.jpg",
            "shortDescription": "Test Layer 1",
            "type": "image",
            "relations": {},
            "filename" : "PE07-So-07_Z001.jpg",
            "height" : 2423,
            "width" : 3513,
            "georeference": {
                "bottomLeftCoordinates": [39.1411810096, 27.1892609283],
                "topLeftCoordinates": [39.1412672328, 27.1892609283],
                "topRightCoordinates": [39.1412672328, 27.1893859555]
            }
        },
        "synced": 0
    },
    {
        "resource": {
            "id": "o26",
            "identifier": "mapLayerTest2.png",
            "shortDescription": "Test Layer 2",
            "type": "image",
            "relations": {},
            "filename" : "mapLayerTest2.png",
            "height" : 782,
            "width" : 748,
            "georeference": {
                "topLeftCoordinates": [25, -75],
                "topRightCoordinates": [25, -25],
                "bottomLeftCoordinates": [-25, -75]
            }
        },
        "synced": 0
    },
];