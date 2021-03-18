import {mapToArray} from '../../../../src/app/core/util/transformers';


describe('mapToArray', () => {

    it('mapToArray', () => {

        const map = {
            'k1': {},
            'k2': {}
        };

        expect(
            mapToArray('id')(map)
        ).toEqual(
            [ {'id': 'k1'}, {'id': 'k2'} ]
        );
    });
});
