import { CategoryForm } from '../../src/model';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('Category', () => {
    
    it('getFields', () => {

        const category = {
            groups: [{
                name: 'stem',
                fields:
                    [{
                        name: 'fieldA',
                        label: 'Field A',
                        inputType: 'text'
                    }]
            }]
        };

        const fields = CategoryForm.getFields(category as any);

        expect(fields[0].name).toEqual('fieldA');
    });
});
