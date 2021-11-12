import { ConfigurationIndex } from '../../../../src/app/components/configuration/configuration-index';


describe('ConfigurationIndex', () => {

    it('find category forms', () => {

        const categories = [
            {
                name: 'A:default',
                label: { de: 'A' },
                defaultLabel: { de: 'A' },
                parentCategory: {
                    name: 'A:parent'
                }
            }
        ]
        const index = ConfigurationIndex.create(categories as any);

        const result = ConfigurationIndex.findCategoryForms(index, '', 'A:parent');
        expect(result[0].name).toEqual('A:default');
    })
});
