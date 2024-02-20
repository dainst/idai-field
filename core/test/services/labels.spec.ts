import { Valuelist } from '../../src/model';
import { Labels } from '../../src/services/labels';


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

        expect(labels.getFieldLabel(category, 'aField')).toBe('Ein Feld');
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
        expect(labels.getFieldLabel(category,'aField')).toBe('aField');
    });


    it('sort values alphanumerically', () => {

        const valuelist: Valuelist = {
            values: {
                '1': { label: { de: 'B300' } },
                '2': { label: { de: 'A3' } },
                '3': { label: { de: 'B3' } },
                '4': { label: { de: 'A300' } }
            },
            id: '1'
        };

        const labels = new Labels(getLanguages);
        expect(labels.orderKeysByLabels(valuelist)).toEqual(['2', '4', '3', '1']);
    });


    // TODO move to valuelist-definition.spec
    it('sort values by custom order', () => {

        const valuelist: Valuelist = {
            values: {
                '1': { label: { de: 'A' } },
                '2': { label: { de: 'B' } },
                '3': { label: { de: 'C' } },
                '4': { label: { de: 'D' } },
            },
            order: ['2', '4', '3', '1'],
            id: '1'
        };

        const labels = new Labels(getLanguages);
        expect(labels.orderKeysByLabels(valuelist)).toEqual(['2', '4', '3', '1']);
    });
});
