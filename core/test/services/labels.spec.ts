import {ValuelistDefinition} from '../../src/model/valuelist-definition';
import {Labels} from '../../src/services/labels';


describe('Labels', () => {


    const getLanguages = () => ['de'];


    it('should get label for category', () => {

        const category = {
            name: 'T',
            groups: [{
                name: 'A',
                fields: [{
                    name: 'aField',
                    label: { de: 'Ein Feld' }
                }]
            }]
        } as any;

        const labels = new Labels(getLanguages);

        expect(labels.getFieldDefinitionLabel(category, 'aField')).toBe('Ein Feld');
    });


    it('should get default label if not defined', () => {

        const category = {
            name: 'T',
            groups: [{
                fields: [{
                    name: 'aField'
                }]
            }]
        } as any;

        const labels = new Labels(getLanguages);
        expect(labels.getFieldDefinitionLabel(category,'aField')).toBe('aField');
    });


    it('sort values alphanumerically', () => {

        const valuelist: ValuelistDefinition = {
            values: {
                '1': { labels: { de: 'B300' } },
                '2': { labels: { de: 'A3' } },
                '3': { labels: { de: 'B3' } },
                '4': { labels: { de: 'A300' } }
            },
            id: '1'
        };

        const labels = new Labels(getLanguages);
        expect(labels.getOrderedValues(valuelist)).toEqual(['2', '4', '3', '1'])
    });


    it('sort values by custom order', () => {

        const valuelist: ValuelistDefinition = {
            values: {
                '1': { labels: { de: 'A' } },
                '2': { labels: { de: 'B' } },
                '3': { labels: { de: 'C' } },
                '4': { labels: { de: 'D' } },
            },
            order: ['2', '4', '3', '1'],
            id: '1'
        };

        const labels = new Labels(getLanguages);
        expect(labels.getOrderedValues(valuelist)).toEqual(['2', '4', '3', '1'])
    });
});
