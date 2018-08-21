import {Document} from '../../src/core/model/document';


export const OBJECTS: Document[] = [
    
    {
        'resource': {
            'id': '/demo/1',
            'identifier': 'ob1',
            'type': 'Object',
            'multiple_input': [ 'a' , 'b' ],
            'unsigned_integer_input': 0,
            'some_date': "31.12.2016",
            'dating_input': [
                {
                    'hasBegin': {
                      'year': -2
                    },
                    'hasEnd': {
                      'year': -1
                    },
                    'hasSource': 'eine Quellenangabe',
                    'isImprecise': true,
                    'hasLabel': 'ca. 2 v.Chr. – 1 v.Chr. [eine Quellenangabe]'
                }
            ],
            'dimension': [
                {
                    'hasValue': 120000,
                    'hasInputValue': 12,
                    'hasMeasurementPosition': 'an Bruchkante',
                    'hasMeasurementComment': 'ein Kommentar hier',
                    'hasInputUnit': 'cm',
                    'isImprecise': true,
                    'hasLabel': 'ca. 12cm, Gemessen an Bruchkante (ein Kommentar hier)'
                }
            ],
            'unsigned_float_input': 0,
            'float_input': -42,
            'single_select_radio': 'CD',
            'relations': { 'Belongs to': ['/demo/2'] }
        },
        'created': { user: 'Demo', date: new Date() },
        'modified': [ { user: 'Demo', date: new Date() } ]
    },

    {
        'resource': {
            'id': '/demo/2',
            'identifier': 'ob2',
            'non_editable': 'not editable',
            'type': 'Object',
            'relations': {
                'Includes': ['/demo/1']
            }
        },
        'created': { user: 'Demo', date: new Date() },
        'modified': [ { user: 'Demo', date: new Date() } ]
    },

    {
        'resource': {
            'id': '/demo/3',
            'identifier': 'ob3',
            'type': 'Object',
            'relations': {}
        },
        'created': { user: 'Demo', date: new Date() },
        'modified': [ { user: 'Demo', date: new Date() } ]
    },

    {
        'resource': {
            'id': '/demo/4',
            'identifier': 'ob4',
            'type': 'Object_enhanced',
            'relations': {}
        },
        'created': { user: 'Demo', date: new Date() },
        'modified': [ { user: 'Demo', date: new Date() } ]
    },

    {
        'resource': {
            'id': '/demo/5',
            'identifier': 'ob5',
            'type': 'Section',
            'relations': {}
        },
        'created': { user: 'Demo', date: new Date() },
        'modified': [ { user: 'Demo', date: new Date() } ]
    },

    {
        'resource': {
            'id': '/demo/6',
            'identifier': 'ob6',
            'type': 'Section',
            'relations': {}
        },
        'created': { user: 'Demo', date: new Date() },
        'modified': [ { user: 'Demo', date: new Date() } ]
    },

    {
        'resource': {
            'id': '/demo/7',
            'identifier': 'ob7',
            'type': 'Section',
            'relations': {}
        },
        'created': { user: 'Demo', date: new Date() },
        'modified': [ { user: 'Demo', date: new Date() } ]
    },
    
    {
        'resource': {
            'id': '/demo/8',
            'identifier': 'ob8',
            'type': 'Image',
            'dimensions': '800x600',
            'relations': {}
        },
        'created': { user: 'Demo', date: new Date() },
        'modified': [ { user: 'Demo', date: new Date() } ]
    },

    {
        'resource': {
            'id': '/demo/9',
            'identifier': 'ob9',
            'type': 'Drawing',
            'dimensions': '8000x6000',
            'relations': {}
        },
        'created': { user: 'Demo', date: new Date() },
        'modified': [ { user: 'Demo', date: new Date() } ]
    }
];