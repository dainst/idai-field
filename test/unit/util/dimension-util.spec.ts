import {Dimension} from 'idai-components-2';
import {DimensionUtil} from '../../../app/core/util/dimension-util';

/**
 * @author Daniel de Oliveira
 */
describe('DimensionUtil', () => {

    it('translate back to original state', () => {

        const dim: Dimension = {
            inputValue: 100,
            inputRangeEndValue: 200,
            inputUnit: 'cm',
            isImprecise: false,
            isRange: false
        };

        DimensionUtil.addNormalizedValues(dim);
        expect(dim.value).not.toBeUndefined();

        const reverted = DimensionUtil.revert(dim);
        expect(reverted['value']).toBeUndefined();
    });
});