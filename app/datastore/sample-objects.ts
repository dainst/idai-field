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
                "coordinates": [ 27.289327540154142, 39.4422354724396197 ],
                "crs": "local"
            },
            "type": "object"
        },
        "synced": 0
    },
    {
        "resource": {
            "id": "o25",
            "identifier": "mapLayerTest1.png",
            "shortDescription": "Test Layer 1",
            "type": "image",
            "relations": {},
            "filename" : "mapLayerTest1.png",
            "height" : 701,
            "width" : 845,
            "georeference": {
                "topLeftCoordinates": [25, -25],
                "topRightCoordinates": [25, 25],
                "bottomLeftCoordinates": [-25, -25]
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