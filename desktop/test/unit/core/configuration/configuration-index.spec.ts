import {ConfigurationIndex} from '../../../../src/app/core/configuration/configuration-index';


describe('ConfigurationIndex', () => {

    it('base case', () => {

        const categories = [
            {
                name: 'a:default',
                label: { de: 'A' },
                defaultLabel: { de: 'A' },
                parentCategory: {
                    name: 'a:parent'
                }
            }
        ]
        const index = ConfigurationIndex.create(categories as any);

        const result = ConfigurationIndex.find(index, '', 'a:parent');
        expect(result[0].name).toEqual('a:default');
    })
});
