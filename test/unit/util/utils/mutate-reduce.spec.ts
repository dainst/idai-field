import {mutateReduce} from '../../../../app/core/util/utils';

describe('mutateReduce', () => {

    it('experimental', () => {

        expect(
            mutateReduce((acc, a: any) => acc[a] = a, {})([13, 14])
        ).toEqual({'13': 13, '14': 14});
    });
});
