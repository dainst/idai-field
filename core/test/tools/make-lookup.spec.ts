import { makeLookup } from "../../src/tools/transformers";


describe('makeLookup', () => {

    it('makeLookup', () => {

        expect(
            makeLookup(['d','e'])([{d: {e: 17}}, {d: {e: 19}}])
        ).toEqual(
            {
                17: {d: { e: 17}},
                19: {d: { e: 19}}
            }
        );
    });
});
