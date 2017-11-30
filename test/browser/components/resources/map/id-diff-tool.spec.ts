import {IdDiffTool} from '../../../../../app/components/resources/map/map/id-diff-tool';
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function main() {

    describe('IdDiffTool', () => {

        it('remove one', () => {

          const layerIds = ['1','2'];

          const { added, removed } = IdDiffTool.transduce(layerIds,['1']);
          expect(added).toEqual([]);
          expect(removed).toEqual(['2']);
        });


        it('add one', () => {

            const layerIds = ['1','2'];

            const { added, removed } = IdDiffTool.transduce(layerIds,['1','2','3']);
            expect(added).toEqual(['3']);
            expect(removed).toEqual([]);
        });


        it('add one and remove one', () => {

            const layerIds = ['1','2','3'];

            const { added, removed } = IdDiffTool.transduce(layerIds,['2','3','4']);
            expect(added).toEqual(['4']);
            expect(removed).toEqual(['1']);
        });
    })
}