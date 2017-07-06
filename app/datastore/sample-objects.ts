import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';

export var DOCS: IdaiFieldDocument[] = [
    {
        "resource": {
            "id": "tf1",
            "identifier": "testf1",
            "shortDescription": "Testfund",
            "relations": {
                "isRecordedIn": ["t1"],
                "liesWithin": ["c1"]
            },
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
    {
        "resource": {
            "id": "t1",
            "identifier": "trench1",
            "shortDescription": "Goldener Schnitt",
            "relations": {
                "records": ["c1", "tf1"]
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[27.189218354962215, 39.14132050335332], [27.189276375601313, 39.14133824217116], [27.18928181180254, 39.14132438323931], [27.189226035114622, 39.141306298358316], [27.189218354962215, 39.14132050335332]]],
                "crs": "local"
            },
            "type": "trench"
        },
        "synced": 0
    },
    {
        "resource": {
            "id": "c1",
            "identifier": "context1",
            "shortDescription": "Ein Befund",
            "relations": {
                "isRecordedIn": ["t1"],
                "includes": ["tf1"]
            },
            "geometry": {
                "type": "Point",
                "coordinates": [ 27.2892609283, 39.1411810096 ],
                "crs": "local"
            },
            "type": "context"
        },
        "synced": 0
    }
];