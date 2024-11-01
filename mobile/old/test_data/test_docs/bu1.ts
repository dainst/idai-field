import { Document } from 'idai-field-core';

export const bu1: Document = {
    _id: 'bu1',
    resource: {
      id: 'bu1',
      identifier: 'B1',
      shortDescription: 'Building 1',
      relations: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
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
      },
      type: 'Building',
      category: 'Building'
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
    _rev: '1-8408df7e3f6d82af521e88c5694b2b90'
};