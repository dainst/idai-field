import {Labels} from '../../src/services/labels';


describe('Labels', () => {

    class Languages {

        public get() { return ['de'] }
    }

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

        const labels = new Labels(undefined, new Languages());

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

        const labels = new Labels(undefined, new Languages());
        expect(labels.getFieldDefinitionLabel(category,'aField')).toBe('aField');
    });
});
