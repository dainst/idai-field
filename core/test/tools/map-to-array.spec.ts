import { mapToArray } from "../../src/tools/transformers";


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
