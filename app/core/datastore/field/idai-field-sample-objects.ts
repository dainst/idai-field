import {NewDocument} from 'idai-components-2/core';

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
            'shortDescription': 'Goldener Schnitt',
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
            'shortDescription': 'Matrix-Schnitt',
            'relations': {
                'isRecordedIn': []
            },
            'type': 'Trench'
        }
    },
    {
        'resource': {
            'id': 'si1',
            'identifier': 'SE1',
            'shortDescription': 'Ein Befund',
            'relations': {
                'isRecordedIn': ['t2'],
                'isAfter': ['si2', 'si5'],
            },
            'type': 'Feature'
        }
    },
    {
        'resource': {
            'id': 'si2',
            'identifier': 'SE2',
            'shortDescription': 'Ein Erdbefund',
            'relations': {
                'isRecordedIn': ['t2'],
                'isBefore': ['si1'],
                'isAfter': ['si3']
            },
            'type': 'Layer'
        }
    },
    {
        'resource': {
            'id': 'si3',
            'identifier': 'SE3',
            'shortDescription': 'Architektur',
            'relations': {
                'isRecordedIn': ['t2'],
                'isBefore': ['si2'],
                'isAfter': ['si4'],
                'isContemporaryWith': ['si5']
            },
            'type': 'Architecture'
        }
    },
    {
        'resource': {
            'id': 'si4',
            'identifier': 'SE4',
            'shortDescription': 'Ein Befund',
            'relations': {
                'isRecordedIn': ['t2'],
                'isBefore': ['si3'],
            },
            'type': 'Feature'
        }
    },
    {
        'resource': {
            'id': 'si5',
            'identifier': 'SE5',
            'shortDescription': 'Ein Befund',
            'relations': {
                'isRecordedIn': ['t2'],
                'isBefore': ['si1'],
                'isContemporaryWith': ['si3']
            },
            'type': 'Feature'
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
