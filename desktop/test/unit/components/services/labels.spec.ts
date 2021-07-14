import { ProjectConfiguration, Tree } from 'idai-field-core';
import {Labels} from '../../../../src/app/components/services/labels';


describe('Labels', () => {

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

        const configuration: ProjectConfiguration = new ProjectConfiguration([Tree.buildForest([[category, []]]), []]);
        const labels = new Labels(configuration);

        expect(labels.getFieldDefinitionLabel('T', 'aField')).toBe('Ein Feld');
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

        const configuration: ProjectConfiguration = new ProjectConfiguration([Tree.buildForest([[ category, []]]), []]);

        const labels = new Labels(configuration);
        expect(labels.getFieldDefinitionLabel('T','aField')).toBe('aField');
    });


    it('should throw an error if field is not defined', () => {

        const configuration: ProjectConfiguration = new ProjectConfiguration([[], []]);
        const labels = new Labels(configuration);

        expect(() => {
            labels.getFieldDefinitionLabel('UndefinedCategory', 'someField');
        }).toThrow();
    });
});
