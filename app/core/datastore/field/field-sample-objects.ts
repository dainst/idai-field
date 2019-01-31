import {NewDocument} from 'idai-components-2';

export const getSampleDocuments = (locale: string): NewDocument[] => [
    {
        'resource': {
            'id': 'project',
            'identifier': 'test',
            'shortDescription': locale === 'de' ? 'Testprojekt' : 'Test project',
            'relations': {},
            'type': 'Project'
        }
    },
    {
        'resource': {
            'id': 't1',
            'identifier': locale === 'de' ? 'S1' : 'T1',
            'shortDescription': locale === 'de' ? 'Schnitt 1' : 'Trench 1',
            'relations': {},
            'geometry': {
                'type': 'Polygon',
                'coordinates': [[
                    [27.18926513195038, 39.14123618602753],
                    [27.18935239315033, 39.141262888908386],
                    [27.18937313556671, 39.14121866226196],
                    [27.18929159641266, 39.14118945598602],
                    [27.18926513195038, 39.14123618602753]]]
            },
            'type': 'Trench'
        }
    },
    {
        'resource': {
            'id': 't2',
            'identifier': locale === 'de' ? 'S2' : 'T2',
            'shortDescription': locale === 'de' ? 'Schnitt 2' : 'Trench 2',
            'relations': {},
            'geometry' : {
                'type': 'Polygon',
                'coordinates' : [[
                    [27.18933606147766, 39.14117097854614],
                    [27.189400672912598, 39.14119362831116],
                    [27.189414739608765, 39.14115810394287],
                    [27.18934917449951, 39.141135454177856]
                ]]
            },
            'type': 'Trench'
        }
    },
    {
        'resource': {
            'id': 'si1',
            'identifier': locale === 'de' ? 'SE1' : 'SU1',
            'shortDescription': locale === 'de' ? 'Stratigraphische Einheit' : 'Stratrigraphical unit',
            'hasPeriod': 'Kaiserzeitlich',
            'relations': {
                'isRecordedIn': ['t2'],
                'isAfter': ['si2', 'si5'],
            },
            'geometry' : {
                'type': 'Polygon',
                'coordinates' : [
                    [
                        [
                            27.18934252858162,
                            39.141164898872375
                        ],
                        [
                            27.189349323511124,
                            39.14114570617676
                        ],
                        [
                            27.189385801553726,
                            39.14115810394287
                        ],
                        [
                            27.189377456903458,
                            39.14117705821991
                        ]
                    ]
                ]
            },
            'type': 'Feature'
        }
    },
    {
        'resource': {
            'id': 'si2',
            'identifier': locale === 'de' ? 'SE2' : 'SU2',
            'shortDescription': locale === 'de' ? 'Erdbefund' : 'Layer',
            'hasPeriod': 'Kaiserzeitlich',
            'relations': {
                'isRecordedIn': ['t2'],
                'isBefore': ['si1'],
                'isAfter': ['si3']
            },
            'geometry' : {
                'type': 'Polygon',
                'coordinates' : [
                    [
                        [
                            27.18934056162834,
                            39.14116990566254
                        ],
                        [
                            27.189364075660706,
                            39.14117681980133
                        ],
                        [
                            27.18937572836876,
                            39.14114964008331
                        ],
                        [
                            27.18935140967369,
                            39.141140818595886
                        ]
                    ]
                ]
            },
            'type': 'Layer'
        }
    },
    {
        'resource': {
            'id': 'si3',
            'identifier': locale === 'de' ? 'SE3' : 'SU3',
            'hasPeriod': 'Bronzezeitlich',
            'shortDescription': locale === 'de' ? 'Architektur' : 'Architecture',
            'relations': {
                'isRecordedIn': ['t2'],
                'isBefore': ['si2'],
                'isAfter': ['si4'],
                'isContemporaryWith': ['si5']
            },
            'geometry' : {
                'type': 'Polygon',
                'coordinates' : [
                    [
                        [
                            27.18934252858162,
                            39.141164898872375
                        ],
                        [
                            27.189349323511124,
                            39.14114570617676
                        ],
                        [
                            27.189373926074083,
                            39.14115406783214
                        ],
                        [
                            27.189365923023853,
                            39.14117304301268
                        ],
                        [
                            27.189364075660706,
                            39.14117681980133
                        ],
                        [
                            27.18935799598694,
                            39.14117455482483
                        ],
                        [
                            27.18935216477846,
                            39.14116825345285
                        ]
                    ]
                ]
            },
            'type': 'Architecture'
        }
    },
    {
        'resource': {
            'id': 'si4',
            'identifier': locale === 'de' ? 'SE4' : 'SU4',
            'hasPeriod': 'Bronzezeitlich',
            'shortDescription': locale === 'de' ? 'Grab' : 'Grave',
            'relations': {
                'isRecordedIn': ['t2'],
                'isBefore': ['si3'],
            },
            'geometry' : {
                'type': 'Polygon',
                'coordinates' : [
                    [
                        [
                            27.18934690952301,
                            39.14115846157074
                        ],
                        [
                            27.189355731010437,
                            39.14116156101227
                        ],
                        [
                            27.18935853242874,
                            39.141154527664185
                        ],
                        [
                            27.189349591732025,
                            39.1411514878273
                        ]
                    ]
                ]
            },
            'type': 'Grave'
        }
    },
    {
        'resource': {
            'id': 'si5',
            'identifier': locale === 'de' ? 'SE5' : 'SU5',
            'hasPeriod': 'Bronzezeitlich',
            'shortDescription': locale === 'de' ? 'Erdbefund' : 'Layer',
            'relations': {
                'isRecordedIn': ['t2'],
                'isBefore': ['si1'],
                'isContemporaryWith': ['si3']
            },
            'geometry' : {
                'type': 'Polygon',
                'coordinates' : [
                    [
                        [
                            27.189364075660706,
                            39.14117681980133
                        ],
                        [
                            27.18936642305816,
                            39.14118162190462
                        ],
                        [
                            27.18937080865352,
                            39.14118315929045
                        ],
                        [
                            27.18937286734581,
                            39.14118027687073
                        ],
                        [
                            27.18937799334526,
                            39.14118039608002
                        ],
                        [
                            27.189407336614174,
                            39.14117679964107
                        ],
                        [
                            27.18940436508236,
                            39.14115452001557
                        ],
                        [
                            27.189366375658896,
                            39.141141396396556
                        ],
                        [
                            27.189362369094564,
                            39.141150139969824
                        ],
                        [
                            27.189373926074083,
                            39.14115406783214
                        ]
                    ]
                ]
            },
            'type': 'Layer'
        }
    },
    {
        'resource': {
            'id': 'si0',
            'identifier': locale === 'de' ? 'SE0' : 'SU0',
            'shortDescription': locale === 'de' ? 'Stratigraphische Einheit' : 'Stratigraphical unit',
                'relations': {
                'isRecordedIn': ['t1'],
                'includes': ['tf1']
            },
            'geometry': {
                'type': 'Polygon',
                'coordinates': [[
                    [27.189332902431488, 39.1412228345871],
                    [27.18933594226837, 39.14123010635376],
                    [27.18933880329132, 39.141228795051575],
                    [27.189336717128754, 39.1412219107151],
                    [27.189332902431488, 39.1412228345871]
                ]]
            },
            'type': 'Feature'
        }
    },
    {
        'resource': {
            'id': 'tf1',
            'identifier': 'testf1',
            'shortDescription': locale === 'de' ? 'Testfund' : 'Test find',
            'relations': {
                'isRecordedIn': ['t1'],
                'liesWithin': ['si0']
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [ 27.189335972070694, 39.14122423529625]
            },
            'type': 'Find'
        }
    },
    {
        'resource': {
            'id': 'i1',
            'identifier': 'PE07-So-07_Z001.jpg',
            'shortDescription': 'Test Layer 1',
            'type': 'Drawing',
            'originalFilename' : 'PE07-So-07_Z001.jpg',
            'height' : 2423,
            'width' : 3513,
            'relations': {},
            'georeference': {
                'bottomLeftCoordinates': [39.1411810096, 27.1892609283],
                'topLeftCoordinates': [39.1412672328, 27.1892609283],
                'topRightCoordinates': [39.1412672328, 27.1893859555]
            }
        }
    },
    {
        'resource': {
            'id': 'i2',
            'identifier': 'mapLayerTest2.png',
            'shortDescription': 'Test Layer 2',
            'type': 'Image',
            'relations': {},
            'originalFilename' : 'mapLayerTest2.png',
            'height' : 782,
            'width' : 748,
            'georeference': {
                'bottomLeftCoordinates': [39.1412810096, 27.1893609283],
                'topLeftCoordinates': [39.1413672328, 27.1893609283],
                'topRightCoordinates': [39.1413672328, 27.1894859555]
            }
        }
    },
    {
        'resource': {
            'id': 'sa1',
            'identifier': 'A1',
            'shortDescription': locale === 'de' ? 'Survey-Areal 1' : 'Survey area 1',
            'type': 'Survey',
            'relations': {},
            'geometry': {
                'type': 'Polygon',
                'coordinates': [
                    [
                        [
                            27.18937349319458,
                            39.141260862350464
                        ],
                        [
                            27.189372777938843,
                            39.1412456035614
                        ],
                        [
                            27.18937849998474,
                            39.14121985435486
                        ],
                        [
                            27.189371585845947,
                            39.14120292663574
                        ],
                        [
                            27.189374685287476,
                            39.141199827194214
                        ],
                        [
                            27.18941354751587,
                            39.14121198654175
                        ],
                        [
                            27.189414501190186,
                            39.141263484954834
                        ]
                    ]
                ]
            }
        }
    },
    {
        'resource': {
            'id': 'syu1',
            'identifier': locale === 'de' ? 'PQ1' : 'SUR1',
            'shortDescription': locale === 'de' ? 'Planquadrat 1' : 'Survey unit 1',
            'type': 'SurveyUnit',
            'relations': {
                'isRecordedIn': ['sa1']
            },
            'geometry': {
                'type': 'Polygon',
                'coordinates': [
                    [
                        [
                            27.189372777938843,
                            39.1412456035614
                        ],
                        [
                            27.189391613006592,
                            39.14124584197998
                        ],
                        [
                            27.189392059649148,
                            39.14126204974
                        ],
                        [
                            27.18937349319458,
                            39.141260862350464
                        ]
                    ]
                ]
            }
        }
    },
    {
        'resource': {
            'id': 'syu2',
            'identifier': locale === 'de' ? 'PQ2' : 'SUR2',
            'shortDescription': locale === 'de' ? 'Planquadrat 2' : 'Survey unit 2',
            'type': 'SurveyUnit',
            'relations': {
                'isRecordedIn': ['sa1']
            },
            'geometry': {
                'type': 'Polygon',
                'coordinates': [
                    [
                        [
                            27.189392059649148,
                            39.14126204974
                        ],
                        [
                            27.189391613006592,
                            39.14124584197998
                        ],
                        [
                            27.189414169512915,
                            39.1412455743823
                        ],
                        [
                            27.189414501190186,
                            39.141263484954834
                        ]
                    ]
                ]
            }
        }
    },
    {
        'resource': {
            'id': 'st1',
            'identifier': locale === 'de' ? 'PQ1-ST1' : 'SUR1-ST1',
            'shortDescription': locale === 'de' ? 'Ein Stein' : 'A stone',
            'type': 'SurveyUnit',
            'relations': {
                'isRecordedIn': ['sa1'],
                'liesWithin': ['syu1']
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [
                    27.189382433891296,
                    39.1412538588047
                ]
            }
        }
    },
    {
        'resource': {
            'id': 'bu1',
            'identifier': 'B1',
            'shortDescription': locale === 'de' ? 'Gebäude 1' : 'Building 1',
            'type': 'Building',
            'relations': {},
            'geometry': {
                'type': 'Polygon',
                'coordinates': [
                    [
                        [
                            27.18925452232361,
                            39.14129686355591
                        ],
                        [
                            27.189281702041626,
                            39.14129686355591
                        ],
                        [
                            27.189281702041626,
                            39.14131808280945
                        ],
                        [
                            27.18925452232361,
                            39.14131808280945
                        ]
                    ]
                ]
            }
        }
    },
    {
        'resource': {
            'id': 'r1',
            'identifier': 'R1',
            'shortDescription': locale === 'de' ? 'Raum 1' : 'Room 1',
            'type': 'Room',
            'relations': {
                'isRecordedIn': ['bu1']
            },
            'geometry': {
                'type': 'Polygon',
                'coordinates': [
                    [
                        [
                            27.189267694950104,
                            39.14131808280945
                        ],
                        [
                            27.18926763534546,
                            39.141301691532135
                        ],
                        [
                            27.189272701740265,
                            39.14130163192749
                        ],
                        [
                            27.18927252292633,
                            39.14129686355591
                        ],
                        [
                            27.189281702041626,
                            39.14129686355591
                        ],
                        [
                            27.189281702041626,
                            39.14131808280945
                        ]
                    ]
                ]
            },
        }
    },
    {
        'resource': {
            'id': 't3',
            'identifier': 'S3',
            'shortDescription': 'Schnitt 3',
            'relations': {
                'isRecordedIn': [],
                'isDepictedIn': ['example_model']
            },
            'type': 'Trench'
        }
    },
    {
        'resource': {
            'id': 'l1',
            'identifier': 'E1',
            'shortDescription': 'Erdbefund',
            'relations': {
                'isRecordedIn': ['t3']
            },
            'geometry': {
                'type': 'Polygon',
                'coordinates': [[
                    [
                        -1.5,
                        -8,
                        0.79
                    ],
                    [
                        1.3515625,
                        -7.984375,
                        0.64
                    ],
                    [
                        1.3125,
                        -5.195312,
                        0.655
                    ],
                    [
                        -1.46875,
                        -5.226562,
                        0.67
                    ]
                ]]
            },
            'type': 'Layer'
        }
    },
    {
        'resource': {
            'id': 'ft1',
            'identifier': 'F1',
            'shortDescription': 'Fußboden',
            'relations': {
                'isRecordedIn': ['t3']
            },
            'geometry': {
                'type': 'Polygon',
                'coordinates': [
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
            'type': 'Floor'
        }
    },
    {
        'resource': {
            'id': 'su1',
            'identifier': 'SE1',
            'shortDescription': 'Stratigraphische Einheit',
            'relations': {
                'isRecordedIn': ['t3']
            },
            'geometry': {
                'type': 'Polygon',
                'coordinates': [
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
            'type': 'Feature'
        }
    },
    {
        'resource': {
            'id': 'su2',
            'identifier': 'L1',
            'shortDescription': 'Markierungslinie 1',
            'relations': {
                'isRecordedIn': ['t3']
            },
            'geometry': {
                'type': 'LineString',
                'coordinates': [
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
            'type': 'Feature'
        }
    },
    {
        'resource': {
            'id': 'su3',
            'identifier': 'L2',
            'shortDescription': 'Markierungslinie 2',
            'relations': {
                'isRecordedIn': ['t3']
            },
            'geometry': {
                'type': 'LineString',
                'coordinates':
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
            'type': 'Feature'
        }
    },
    {
        'resource': {
            'id': 'f1',
            'identifier': 'Z1',
            'shortDescription': 'Fund (Ziegel)',
            'relations': {
                'isRecordedIn': ['t3']
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [
                    -3.90625,
                    -3.609375,
                    0.65
                ]
            },
            'type': 'Brick'
        }
    },
    {
        'resource': {
            'id': 'f2',
            'identifier': 'K1',
            'shortDescription': 'Fund (Keramik)',
            'relations': {
                'isRecordedIn': ['t3']
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [
                    -1.0125,
                    -5.628125,
                    0.66
                ]
            },
            'type': 'Pottery'
        }
    },
    {
        'resource': {
            'id': 'f3',
            'identifier': 'K2',
            'shortDescription': 'Fund (Keramik)',
            'relations': {
                'isRecordedIn': ['t3']
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [
                    -0.7125,
                    -6.828125,
                    0.66
                ]
            },
            'type': 'Pottery'
        }
    },
    {
        'resource': {
            'id': 'f4',
            'identifier': 'M1',
            'shortDescription': 'Fund (Münze)',
            'relations': {
                'isRecordedIn': ['t3']
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [
                    0.4125,
                    -7.52,
                    0.66
                ]
            },
            'type': 'Coin'
        }
    },
    {
        'resource': {
            'id': 'example_model',
            'identifier': 'Beispiel-Modell',
            'shortDescription': 'Villa Ortli',
            'type': 'Model3D',
            'thumbnailWidth': 1130,
            'thumbnailHeight': 970,
            'georeferenced': true,
            'relations': {
                'depicts': ['t3']
            }
        }
    }
];
