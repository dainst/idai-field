import {Tree} from '../../src/tools/forest';
import {ProjectConfiguration} from '../../src/configuration/project-configuration';
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

        const configuration: ProjectConfiguration = new ProjectConfiguration([Tree.buildForest([[category, []]]), []]);
        const labels = new Labels(configuration, new Languages());

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

        const labels = new Labels(configuration, new Languages());
        expect(labels.getFieldDefinitionLabel('T','aField')).toBe('aField');
    });


    it('should throw an error if field is not defined', () => {

        const configuration: ProjectConfiguration = new ProjectConfiguration([[], []]);
        const labels = new Labels(configuration, new Languages());

        expect(() => {
            labels.getFieldDefinitionLabel('UndefinedCategory', 'someField');
        }).toThrow();
    });
});
