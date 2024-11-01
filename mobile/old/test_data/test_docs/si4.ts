import { Document } from 'idai-field-core';

export const si4: Document = {
    _id: 'si4',
    resource: {
      id: 'si4',
      identifier: 'SU4',
      period: 'Bronzezeitlich',
      shortDescription: 'Grave',
      relations: {
        isRecordedIn: [
          't2'
        ],
        isBefore: [
          'si3'
        ]
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
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
      type: 'Grave',
      category: 'Grave'
    },
    created: {
      user: 'sample_data',
      date: new Date('2021-04-09T06:07:58.867Z')
    },
    modified: [
      {
        user: 'sample_data',
        date: new Date('2021-04-09T06:07:58.867Z')
      }
    ],
    _rev: '1-019c8dc4a0c43b3f06b57969c06e000a'
  };