import {Document} from 'idai-components-2/core';


export const DOCS: Array<Document> = [
    {
        "resource": {
            "id": "test",
            "identifier": "test",
            "shortDescription": "Testprojekt",
            "relations": {
                "isRecordedIn": []
            },
            "type": "Project"
        }
    },
    {
        "resource": {
            "id": "t1",
            "identifier": "S1",
            "shortDescription": "Schnitt",
            "relations": {
                "isRecordedIn": [ "test" ],
                "isDepictedIn": [ "example_model" ]
            },
            "type": "Trench"
        }
    },
    {
        "resource": {
            "id": "l1",
            "identifier": "E1",
            "shortDescription": "Erdbefund",
            "relations": {
                "isRecordedIn": [ "t1" ]
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-1.5, -8, 0.79],
                    [1.3515625, -7.984375, 0.64],
                    [1.3125, -5.195312, 0.655],
                    [-1.46875, -5.226562, 0.67]
                ]]
            },
            "type": "Layer"
        }
    },
    {
        "resource": {
            "id": "o1",
            "identifier": "L1",
            "shortDescription": "Markierungslinie 1",
            "relations": {
                "isRecordedIn": [ "t1" ]
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [
                        -1.984375,
                        -4.59375,
                        0.7
                    ],
                    [
                        -0.984375,
                        -4.546875,
                        0.68
                    ],
                    [
                        -0.03125,
                        -4.453125,
                        0.65
                    ],
                    [
                        1.09375,
                        -4.328125,
                        0.6
                    ],
                    [
                        1.5625,
                        -4.28125,
                        0.6
                    ],
                    [
                        1.8125,
                        -4.265625,
                        0.6
                    ]
                ]
            },
            "type": "Other"
        }
    },
    {
        "resource": {
            "id": "o2",
            "identifier": "L2",
            "shortDescription": "Markierungslinie 2",
            "relations": {
                "isRecordedIn": [ "t1" ]
            },
            "geometry": {
                "type": "LineString",
                "coordinates":
                    [
                        [
                            2.2578125,
                            -8.76953125,
                            0.63
                        ],
                        [
                            2.203125,
                            -8.18359375,
                            0.63
                        ],
                        [
                            2.21875,
                            -7.59375,
                            0.63
                        ],
                        [
                            2.1796875,
                            -7.20703125,
                            0.63
                        ],
                        [
                            2.19921875,
                            -6.97265625,
                            0.63
                        ],
                        [
                            2.1875,
                            -6.828125,
                            0.63
                        ],
                        [
                            2.1640625,
                            -6.55859375,
                            0.63
                        ],
                        [
                            2.1875,
                            -6,
                            0.63
                        ],
                        [
                            2.1875,
                            -5.40234375,
                            0.63
                        ],
                        [
                            2.16796875,
                            -5.337890625,
                            0.63
                        ],
                        [
                            2.126953125,
                            -5.283203125,
                            0.63
                        ],
                        [
                            2.083984375,
                            -5.126953125,
                            0.6
                        ],
                        [
                            2.07421875,
                            -5,
                            0.6
                        ],
                        [
                            2.0859375,
                            -4.87890625,
                            0.6
                        ],
                        [
                            2.125,
                            -4.71875,
                            0.6
                        ],
                        [
                            2.16015625,
                            -4.5625,
                            0.6
                        ],
                        [
                            2.125,
                            -4.4140625,
                            0.6
                        ]
                    ]
            },
            "type": "Other"
        }
    },
    {
        "resource": {
            "id": "ft1",
            "identifier": "F1",
            "shortDescription": "Fußboden",
            "relations": {
                "isRecordedIn": [ "t1" ]
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [
                            -5.015625,
                            -4.8515625,
                            0.656
                        ],
                        [
                            -4.421875,
                            -4.7578125,
                            0.65
                        ],
                        [
                            -3.8515625,
                            -4.7109375,
                            0.65
                        ],
                        [
                            -3.5859375,
                            -4.71875,
                            0.65
                        ],
                        [
                            -3.3203125,
                            -4.6953125,
                            0.65
                        ],
                        [
                            -2.9765625,
                            -4.6640625,
                            0.65
                        ],
                        [
                            -2.6953125,
                            -4.5703125,
                            0.65
                        ],
                        [
                            -2.6875,
                            -3.4140625,
                            0.7
                        ],
                        [
                            -2.78125,
                            -2.921875,
                            0.7
                        ],
                        [
                            -2.7734375,
                            -2.4296875,
                            0.7
                        ],
                        [
                            -2.7421875,
                            -2.1015625,
                            0.7
                        ],
                        [
                            -3.015625,
                            -2.09375,
                            0.7
                        ],
                        [
                            -3.703125,
                            -2.1015625,
                            0.7
                        ],
                        [
                            -4.4765625,
                            -2.09375,
                            0.7
                        ],
                        [
                            -4.765625,
                            -2.1640625,
                            0.7
                        ],
                        [
                            -5,
                            -2.234375,
                            0.7
                        ],
                        [
                            -5.2109375,
                            -2.3046875,
                            0.7
                        ],
                        [
                            -5.484375,
                            -2.42578125,
                            0.7
                        ],
                        [
                            -5.7421875,
                            -2.578125,
                            0.7
                        ],
                        [
                            -5.96875,
                            -2.765625,
                            0.7
                        ],
                        [
                            -6.1484375,
                            -2.953125,
                            0.7
                        ],
                        [
                            -6.5390625,
                            -3.4921875,
                            0.7
                        ],
                        [
                            -6.625,
                            -3.7265625,
                            0.7
                        ],
                        [
                            -6.66015625,
                            -3.8046875,
                            0.7
                        ],
                        [
                            -6.68359375,
                            -3.87890625,
                            0.7
                        ],
                        [
                            -6.69140625,
                            -3.919921875,
                            0.7
                        ],
                        [
                            -6.701171875,
                            -3.96484375,
                            0.7
                        ],
                        [
                            -6.7041015625,
                            -3.998046875,
                            0.7
                        ],
                        [
                            -6.708984375,
                            -4.029296875,
                            0.7
                        ],
                        [
                            -6.3203125,
                            -4.0390625,
                            0.7
                        ],
                        [
                            -6.078125,
                            -4.0234375,
                            0.7
                        ],
                        [
                            -5.84765625,
                            -4.015625,
                            0.7
                        ],
                        [
                            -5.640625,
                            -4.005859375,
                            0.7
                        ],
                        [
                            -5.5234375,
                            -3.998046875,
                            0.7
                        ],
                        [
                            -5.40625,
                            -3.9921875,
                            0.7
                        ],
                        [
                            -5.205078125,
                            -3.982421875,
                            0.7
                        ],
                        [
                            -5.09765625,
                            -3.978515625,
                            0.7
                        ],
                        [
                            -5.04296875,
                            -3.994140625,
                            0.7
                        ],
                        [
                            -5,
                            -4.0078125,
                            0.7
                        ]
                    ]
                ]
            },

            "type": "Floor"
        }
    },
    {
        "resource": {
            "id": "su1",
            "identifier": "SE1",
            "shortDescription": "Stratigraphische Einheit",
            "relations": {
                "isRecordedIn": [ "t1" ]
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [
                            1.8671875,
                            -9.71484375,
                            0.52
                        ],
                        [
                            1.826171875,
                            -9.642578125,
                            0.52
                        ],
                        [
                            1.794921875,
                            -9.56640625,
                            0.52
                        ],
                        [
                            1.771484375,
                            -9.49609375,
                            0.52
                        ],
                        [
                            1.75390625,
                            -9.42578125,
                            0.52
                        ],
                        [
                            1.771484375,
                            -9.357421875,
                            0.52
                        ],
                        [
                            1.8056640625,
                            -9.294921875,
                            0.52
                        ],
                        [
                            1.818359375,
                            -9.24609375,
                            0.52
                        ],
                        [
                            1.833984375,
                            -9.1953125,
                            0.52
                        ],
                        [
                            1.861328125,
                            -9.15234375,
                            0.52
                        ],
                        [
                            1.890625,
                            -9.111328125,
                            0.52
                        ],
                        [
                            1.939453125,
                            -9.06640625,
                            0.52
                        ],
                        [
                            1.990234375,
                            -9.0546875,
                            0.52
                        ],
                        [
                            2.048828125,
                            -9.046875,
                            0.52
                        ],
                        [
                            2.11328125,
                            -9.044921875,
                            0.52
                        ],
                        [
                            2.18359375,
                            -9.046875,
                            0.52
                        ],
                        [
                            2.255859375,
                            -9.060546875,
                            0.52
                        ],
                        [
                            2.328125,
                            -9.099609375,
                            0.52
                        ],
                        [
                            2.390625,
                            -9.1484375,
                            0.52
                        ],
                        [
                            2.451171875,
                            -9.2109375,
                            0.52
                        ],
                        [
                            2.50390625,
                            -9.296875,
                            0.52
                        ],
                        [
                            2.513671875,
                            -9.37109375,
                            0.52
                        ],
                        [
                            2.498046875,
                            -9.431640625,
                            0.52
                        ],
                        [
                            2.453125,
                            -9.5078125,
                            0.52
                        ],
                        [
                            2.443359375,
                            -9.55078125,
                            0.52
                        ],
                        [
                            2.43359375,
                            -9.591796875,
                            0.52
                        ],
                        [
                            2.392578125,
                            -9.654296875,
                            0.52
                        ],
                        [
                            2.369140625,
                            -9.697265625,
                            0.52
                        ],
                        [
                            2.337890625,
                            -9.734375,
                            0.52
                        ],
                        [
                            2.31640625,
                            -9.765625,
                            0.52
                        ],
                        [
                            2.26171875,
                            -9.7890625,
                            0.52
                        ],
                        [
                            2.20703125,
                            -9.8203125,
                            0.52
                        ],
                        [
                            2.14453125,
                            -9.830078125,
                            0.52
                        ],
                        [
                            2.08740234375,
                            -9.83935546875,
                            0.52
                        ],
                        [
                            2.0625,
                            -9.84375,
                            0.52
                        ],
                        [
                            2.037109375,
                            -9.83203125,
                            0.52
                        ],
                        [
                            1.96875,
                            -9.810546875,
                            0.52
                        ],
                        [
                            1.91015625,
                            -9.783203125,
                            0.52
                        ]
                    ]
                ]
            },

            "type": "Feature"
        }
    },
    {
        "resource": {
            "id": "f1",
            "identifier": "Z1",
            "shortDescription": "Fund (Ziegel)",
            "relations": {
                "isRecordedIn": [ "t1" ]
            },
            "geometry": {
                "type": "Point",
                "coordinates": [
                    -3.90625,
                    -3.609375,
                    0.65
                ]
            },
            "type": "Brick"
        }
    },
    {
        "resource": {
            "id": "f2",
            "identifier": "K1",
            "shortDescription": "Fund (Keramik)",
            "relations": {
                "isRecordedIn": [ "t1" ]
            },
            "geometry": {
                "type": "Point",
                "coordinates": [
                    -1.0125,
                    -5.628125,
                    0.66
                ]
            },
            "type": "Pottery"
        }
    },
    {
        "resource": {
            "id": "f3",
            "identifier": "K2",
            "shortDescription": "Fund (Keramik)",
            "relations": {
                "isRecordedIn": [ "t1" ]
            },
            "geometry": {
                "type": "Point",
                "coordinates": [
                    -0.7125,
                    -6.828125,
                    0.66
                ]
            },
            "type": "Pottery"
        }
    },
    {
        "resource": {
            "id": "f4",
            "identifier": "M1",
            "shortDescription": "Fund (Münze)",
            "relations": {
                "isRecordedIn": [ "t1" ]
            },
            "geometry": {
                "type": "Point",
                "coordinates": [
                    0.4125,
                    -7.52,
                    0.66
                ]
            },
            "type": "Coin"
        }
    },
    {
        "resource": {
            "id": "i1",
            "identifier": "PE07-So-07_Z001.jpg",
            "shortDescription": "Plan",
            "type": "Drawing",
            "originalFilename" : "PE07-So-07_Z001.jpg",
            "height" : 2423,
            "width" : 3513,
            "relations": {
                "depicts": []
            },
            "georeference": {
                "bottomLeftCoordinates": [
                    -20.0,
                    6.0
                ],
                "topLeftCoordinates": [
                    0,
                    6.0
                ],
                "topRightCoordinates": [
                    0.0,
                    35.0
                ]
            },
            "georeferenceHeight": 0.63
        }
    },
    {
        "resource": {
            "id": "i2",
            "identifier": "Magnetogramm.jpg",
            "shortDescription": "Magnetogramm",
            "type": "Image",
            "originalFilename": "Magnetogramm.jpg",
            "width": 2441,
            "height": 2261,
            "relations": {
                "depicts": []
            },
            "georeference": {
                "topLeftCoordinates": [
                    3729226.750779353,
                    32678051.9331935
                ],
                "topRightCoordinates": [
                    3729226.750779353,
                    32678407.80318279
                ],
                "bottomLeftCoordinates": [
                    3728897.597007078,
                    32678051.9331935
                ]
            },
            "georeferenceHeight": 12.5
        }
    },
    {
        "resource": {
            "id": "example_model",
            "identifier": "Beispiel-Modell",
            "shortDescription": "Villa Ortli (Crimea)",
            "type": "Model3D",
            "thumbnailWidth": 1130,
            "thumbnailHeight": 970,
            "georeferenced": true,
            "relations": {
                "depicts": ["t1"]
            }
        }
    }
];
