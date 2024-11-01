import { Document } from 'idai-field-core';

export const tf1: Document = {
  _id: 'tf1',
  resource: {
    id: 'tf1',
    identifier: 'testf1',
    shortDescription: 'Test find',
    relations: {
      isRecordedIn: [
        't1'
      ],
      'liesWithin': [
        'si0'
      ]
    },
    geometry: {
      type: 'Point',
      coordinates: [
        27.189335972070694,
        39.14122423529625
      ]
    },
    type: 'Find',
    category: 'Find'
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
  _rev: '1-7d8a5700de4da7ba1848ed5255df788e'
};