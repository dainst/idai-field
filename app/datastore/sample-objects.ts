import {IdaiFieldDocument} from '../model/idai-field-document';

export var DOCS: IdaiFieldDocument[] = [
    {
        "id": "o1",
        "resource": {
            "id": "o1",
            "identifier": "ob1",
            "shortDescription": "Obi One Kenobi",
            "relations": {
                "cuts": ["o2"]
            },
            "geometries": [{
                "type": "Polygon",
                "coordinates": [
                    [
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1],
                        [0, 0]
                    ]
                ],
                "crs": "local"
            }],
            "type": "object"
        },
        "synced": 0
    }, {
        "id": "o2",
        "resource": {
            "id": "o2",
            "identifier": "ob2",
            "shortDescription": "Qui Gon Jinn",
            "relations": {
                "isCutBy": ["o1"]
            },
            "geometries": [{
                "type": "Point",
                "coordinates": [1.5, 1.5],
                "crs": "local"
            }],
            "type": "object"
        },
        "synced": 0
    }, {
        "id": "o3",
        "resource": {
            "id": "o3",
            "identifier": "ob3",
            "shortDescription": "Luke Skywalker",
            "type": "object",
            "relations": {},
            "geometries": [{
                "type": "Polygon",
                "coordinates": [
                    [
                        [0, 0],
                        [-1, 0],
                        [-1, -1],
                        [0, -1],
                        [0, 0]
                    ]
                ],
                "crs": "local"
            }]
        },
        "synced": 0
    }, {
        "id": "o4",
        "resource": {
            "id": "o4",
            "identifier": "ob4",
            "shortDescription": "Han Solo",
            "type": "object",
            "relations": {},
            "geometries": [{
                "type": "Point",
                "coordinates": [-1.5, -1.5],
                "crs": "local"
            }]
        },
        "synced": 0
    }, {
        "id": "o5",
        "resource": {
            "id": "o5",
            "identifier": "ob5",
            "shortDescription": "Boba Fett",
            "type": "object",
            "relations": {}
        },
        "synced": 0
    }
];