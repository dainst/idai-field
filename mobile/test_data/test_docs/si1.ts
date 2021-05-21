import { Document } from 'idai-field-core';

export const si1: Document = {
    _id: 'si1',
    resource: {
      id: 'si1',
      identifier: 'SU1',
      shortDescription: 'Stratrigraphical unit',
      period: 'Kaiserzeitlich',
      relations: {
        'isRecordedIn': [
          't2'
        ],
        'isAfter': [
          'si2',
          'si5'
        ]
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
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
      type: 'Feature',
      category: 'Feature'
    },
    created: {
      user: 'sample_data',
      date: new Date('2021-04-09T06:07:58.866Z')
    },
    modified: [
      {
        user: 'sample_data',
        date: new Date('2021-04-09T06:07:58.866Z')
      }
    ],
    _rev: '1-43992167d5947158ea5768d6057fb441'
  };