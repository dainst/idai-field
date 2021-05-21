import { Document } from 'idai-field-core';

export const r1: Document = {
    _id: 'r1',
    resource: {
      id: 'r1',
      identifier: 'R1',
      shortDescription: 'Room 1',
      relations: {
        isRecordedIn: [
          'bu1'
        ]
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
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
      type: 'Room',
      category: 'Room'
    },
    created: {
      user: 'sample_data',
      date: new Date('2021-04-09T06:07:58.867Z')
    },
    'modified': [
      {
        user: 'sample_data',
        date: new Date('2021-04-09T06:07:58.867Z')
      }
    ],
    _rev: '1-d644ee46fcd11e5cfddeb9f84bdbf898'
};