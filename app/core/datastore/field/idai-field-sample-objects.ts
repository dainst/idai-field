import {NewDocument} from 'idai-components-2';

export const DOCS: NewDocument[] = [
    {
        'resource': {
            'id': 'project',
            'identifier': 'test',
            'shortDescription': 'Testprojekt',
            'relations': {},
            'type': 'Project'
        }
    },
    {
        'resource': {
            'id': 't1',
            'identifier': 'S1',
            'shortDescription': 'Schnitt 1',
            'relations': {
                'isRecordedIn': []
            },
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
            'identifier': 'S2',
            'shortDescription': 'Schnitt 2',
            'relations': {
                'isRecordedIn': []
            },
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
            'identifier': 'SE1',
            'shortDescription': 'Ein Befund',
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
            'identifier': 'SE2',
            'shortDescription': 'Ein Erdbefund',
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
            'identifier': 'SE3',
            'hasPeriod': 'Bronzezeitlich',
            'shortDescription': 'Architektur',
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
            'identifier': 'SE4',
            'hasPeriod': 'Bronzezeitlich',
            'shortDescription': 'Ein Grab',
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
            'identifier': 'SE5',
            'hasPeriod': 'Bronzezeitlich',
            'shortDescription': 'Ein Befund',
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
            'identifier': 'SE0',
            'shortDescription': 'Ein Befund',
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
            'shortDescription': 'Testfund',
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
            'id': 'o25',
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
            'id': 'o26',
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
    }
];
