import { NewDocument } from '../../model/document/document';
import { I18N } from '../../tools';
import { sampleDataLabels } from './sample-data-labels';


export const getSampleDocuments = (locale: string): NewDocument[] => [
    {
        'resource': {
            'id': 'project',
            'identifier': 'test',
            'shortName': getI18nString('testProject'),
            'staff': [
                { value: sampleDataLabels[locale]['person'] + ' 1', selectable: true },
                { value: sampleDataLabels[locale]['person'] + ' 2', selectable: true }
            ],
            'campaigns': [
                { value: sampleDataLabels[locale]['testCampaign'] + ' 1', selectable: true },
                { value: sampleDataLabels[locale]['testCampaign'] + ' 2', selectable: true }
            ],
            'relations': {
                'hasMapLayer': ['o25', 'o26'],
                'hasDefaultMapLayer': ['o25']
            },
            'category': 'Project'
        }
    },
    {
        'resource': {
            'id': 't1',
            'identifier': sampleDataLabels[locale]['trenchShort'] + '1',
            'shortDescription': getI18nString('trench', ' 1'),
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
            'category': 'Trench'
        }
    },
    {
        'resource': {
            'id': 't2',
            'identifier': sampleDataLabels[locale]['trenchShort'] + '2',
            'shortDescription': getI18nString('trench', ' 2'),
            'relations': {},
            'geometry': {
                'type': 'Polygon',
                'coordinates': [[
                    [27.18933606147766, 39.14117097854614],
                    [27.189400672912598, 39.14119362831116],
                    [27.189414739608765, 39.14115810394287],
                    [27.18934917449951, 39.141135454177856]
                ]]
            },
            'category': 'Trench'
        }
    },
    {
        'resource': {
            'id': 'si1',
            'identifier': sampleDataLabels[locale]['stratigraphicalUnitShort'] + '1',
            'shortDescription': getI18nString('stratigraphicalUnit'),
            'period': 'Kaiserzeitlich',
            'relations': {
                'isRecordedIn': ['t2'],
                'isAbove': ['si2', 'si5'],
            },
            'geometry': {
                'type': 'Polygon',
                'coordinates': [
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
            'category': 'Feature'
        }
    },
    {
        'resource': {
            'id': 'si2',
            'identifier': sampleDataLabels[locale]['stratigraphicalUnitShort'] + '2',
            'shortDescription': getI18nString('layer'),
            'period': 'Kaiserzeitlich',
            'relations': {
                'isRecordedIn': ['t2'],
                'isBelow': ['si1'],
                'isAbove': ['si3']
            },
            'geometry': {
                'type': 'Polygon',
                'coordinates': [
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
            'category': 'Layer'
        }
    },
    {
        'resource': {
            'id': 'si3',
            'identifier': sampleDataLabels[locale]['stratigraphicalUnitShort'] + '3',
            'period': 'Bronzezeitlich',
            'shortDescription': getI18nString('architecture'),
            'relations': {
                'isRecordedIn': ['t2'],
                'isBelow': ['si2'],
                'isAbove': ['si4'],
                'bondsWith': ['si5']
            },
            'geometry': {
                'type': 'Polygon',
                'coordinates': [
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
            'category': 'Architecture'
        }
    },
    {
        'resource': {
            'id': 'si4',
            'identifier': sampleDataLabels[locale]['stratigraphicalUnitShort'] + '4',
            'period': 'Bronzezeitlich',
            'shortDescription': getI18nString('grave'),
            'relations': {
                'isRecordedIn': ['t2'],
                'isBelow': ['si3'],
            },
            'geometry': {
                'type': 'Polygon',
                'coordinates': [
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
            'category': 'Grave'
        }
    },
    {
        'resource': {
            'id': 'si4-f1',
            'identifier': sampleDataLabels[locale]['stratigraphicalUnitShort'] + '4-'
                + sampleDataLabels[locale]['findShort'] + '1',
            'shortDescription': getI18nString('coin'),
            'relations': {
                'isRecordedIn': ['t2'],
                'liesWithin': ['si4'],
            },
            'category': 'Coin'
        }
    },
    {
        'resource': {
            'id': 'si4-f2',
            'identifier': sampleDataLabels[locale]['stratigraphicalUnitShort'] + '4-'
                + sampleDataLabels[locale]['findShort'] + '2',
            'shortDescription': getI18nString('coin'),
            'relations': {
                'isRecordedIn': ['t2'],
                'liesWithin': ['si4'],
            },
            'category': 'Coin'
        }
    },
    {
        'resource': {
            'id': 'si5',
            'identifier': sampleDataLabels[locale]['stratigraphicalUnitShort'] + '5',
            'period': 'Bronzezeitlich',
            'shortDescription': getI18nString('layer'),
            'relations': {
                'isRecordedIn': ['t2'],
                'isBelow': ['si1'],
                'bondsWith': ['si3']
            },
            'geometry': {
                'type': 'Polygon',
                'coordinates': [
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
            'category': 'Layer'
        }
    },
    {
        'resource': {
            'id': 'si6',
            'identifier': sampleDataLabels[locale]['stratigraphicalUnitShort'] + '6',
            'period': 'Bronzezeitlich',
            'shortDescription': getI18nString('layer'),
            'relations': {
                'isRecordedIn': ['t2'],
            },
            'category': 'Layer'
        }
    },
    {
        'resource': {
            'id': 'si0',
            'identifier': sampleDataLabels[locale]['stratigraphicalUnitShort'] + '0',
            'shortDescription': getI18nString('stratigraphicalUnit'),
            'relations': {
                'isRecordedIn': ['t1']
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
            'category': 'Feature'
        }
    },
    {
        'resource': {
            'id': 'tf1',
            'identifier': sampleDataLabels[locale]['testFindShort'] + 1,
            'shortDescription': getI18nString('testFind'),
            'relations': {
                'isRecordedIn': ['t1'],
                'liesWithin': ['si0']
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [27.189335972070694, 39.14122423529625]
            },
            'category': 'Find'
        }
    },
    {
        'resource': {
            'id': 'o25',
            'identifier': 'PE07-So-07_Z001.jpg',
            'shortDescription': getI18nString('mapLayer', ' 1'),
            'category': 'Drawing',
            'originalFilename': 'PE07-So-07_Z001.jpg',
            'height': 2423,
            'width': 3513,
            'relations': {
                'isMapLayerOf': ['project']
            },
            'georeference': {
                'bottomLeftCoordinates': [39.1411810096, 27.1892609283],
                'topLeftCoordinates': [39.1412672328, 27.1892609283],
                'topRightCoordinates': [39.1412672328, 27.1893859555]
            },
            'draughtsmen': [
                sampleDataLabels[locale]['person'] + ' 1'
            ],
            'imageRights': {
                'en': '© Archaeological Example Association',
                'de': '© Archaeological Example Association',
                'it': '© Archaeological Example Association',
                'uk': '© Archaeological Example Association'
            }
        }
    },
    {
        'resource': {
            'id': 'o26',
            'identifier': 'mapLayerTest2.png',
            'shortDescription': getI18nString('mapLayer', ' 2'),
            'category': 'Image',
            'originalFilename': 'mapLayerTest2.png',
            'height': 782,
            'width': 748,
            'relations': {
                'isMapLayerOf': ['project']
            },
            'georeference': {
                'bottomLeftCoordinates': [39.1412810096, 27.1893609283],
                'topLeftCoordinates': [39.1413672328, 27.1893609283],
                'topRightCoordinates': [39.1413672328, 27.1894859555]
            },
            'draughtsmen': [
                sampleDataLabels[locale]['person'] + ' 2'
            ],
            'imageRights': {
                'en': '© Archaeological Example Association',
                'de': '© Archaeological Example Association',
                'it': '© Archaeological Example Association',
                'uk': '© Archaeological Example Association'
            }
        }
    },
    {
        'resource': {
            'id': 'sa1',
            'identifier': sampleDataLabels[locale]['surveyAreaShort'] + '1',
            'shortDescription': getI18nString('surveyArea'),
            'category': 'Survey',
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
            'identifier': sampleDataLabels[locale]['surveyUnitShort'] + '1',
            'shortDescription': getI18nString('surveyUnit', ' 1'),
            'category': 'SurveyUnit',
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
            'identifier': sampleDataLabels[locale]['surveyUnitShort'] + '2',
            'shortDescription': getI18nString('surveyUnit', ' 2'),
            'category': 'SurveyUnit',
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
            'identifier': sampleDataLabels[locale]['surveyUnitShort'] + '1-'
                + sampleDataLabels[locale]['stoneShort'] + '1',
            'shortDescription': getI18nString('stone'),
            'category': 'SurveyUnit',
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
            'identifier': sampleDataLabels[locale]['buildingShort'] + '1',
            'shortDescription': getI18nString('building', ' 1'),
            'category': 'Building',
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
            'identifier': sampleDataLabels[locale]['roomShort'] + '1',
            'shortDescription': getI18nString('room', ' 1'),
            'category': 'Room',
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
    }
];


const getI18nString = (fieldName: string, suffix?: string): I18N.String => {

    return Object.keys(sampleDataLabels).reduce((result, locale) => {
        result[locale] = sampleDataLabels[locale][fieldName] + (suffix ?? '');
        return result;
    }, {});
};
