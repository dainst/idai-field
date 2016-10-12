import {IdaiFieldDocument} from '../model/idai-field-document';

export var DOCS: IdaiFieldDocument[] = [
    {
        "id": "o1",
        "resource": {
            "id": "o1",
            "identifier": "ob1",
            "shortDescription": "Obi One Kenobi",
            "relations": {},
            "geometries": [{ "type": "Polygon","coordinates":
                [[[2.34375,-2.90625],[0.7421875,-2.8984375],[0.7421875,-3.921875],[2.34375,-3.90625]]]
                ,"crs":"local"
            }],
            "type": "jedi"
        },
        "synced": 0
    }, {
        "id": "o2",
        "resource": {
            "id": "o2",
            "identifier": "ob2",
            "shortDescription": "Boba Fett",
            "relations": {},
            "geometries": [{
                "type":"Point","coordinates":[4.71875,-12.96875],"crs":"local"
            }],
            "type": "dude"
        },
        "synced": 0
    }, {
        "id": "o3",
        "resource": {
            "id": "o3",
            "identifier": "ob3",
            "shortDescription": "Luke Skywalker",
            "type": "jedi",
            "lightsaber_color" : "Blau",
            "relations": {
                "sonOf" : ["o6"],
                "friendOf" : ["o4"]
            },
            "geometries": [{
                "type":"Polygon","coordinates":
                    [[[2.140625,9.71875],[1.265625,9.796875],[1.234375,9.15625],[-3.796875,9.171875],[-3.8125,7.578125],
                        [-3.171875,7.5],[-3.171875,8.484375],[1.28125,8.40625],[1.265625,7.5],[2.15625,7.484375]]],
                "crs":"local"
            }]
        },
        "synced": 0
    }, {
        "id": "o4",
        "resource": {
            "id": "o4",
            "identifier": "ob4",
            "shortDescription": "Han Solo",
            "type": "dude",
            "relations": {
                "friendOf" : ["o3"]
            },
            "geometries": [{
                "type":"Point","coordinates":[0.828125,0.375],"crs":"local"
            }]
        },
        "synced": 0
    }, {
        "id": "o6",
        "resource": {
            "id": "o6",
            "identifier": "ob6",
            "shortDescription": "Darth Vader",
            "type": "jedi",
            "lightsaber_color" : "Rot",
            "relations": {
                "fatherOf" : ["o3"]
            }
        },
        "synced": 0
    }
];