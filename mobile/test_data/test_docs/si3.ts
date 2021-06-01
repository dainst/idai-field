import { Document } from 'idai-field-core';

export const si3: Document = {
    _id: 'si3',
    resource: {
      id: 'si3',
      identifier: 'SU3',
      period: 'Bronzezeitlich',
      shortDescription: 'Architecture',
      relations: {
        isRecordedIn: [
          't2'
        ],
        'isBefore': [
          'si2'
        ],
        'isAfter': [
          'si4'
        ],
        'isContemporaryWith': [
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
      type: 'Architecture',
      category: 'Architecture'
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
    _rev: '1-e36bdf90d1203fcd8d033dc506a12fee'
  };