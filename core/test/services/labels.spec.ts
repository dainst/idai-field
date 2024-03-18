import { Relation, Valuelist } from '../../src/model';
import { Labels } from '../../src/services/labels';


describe('Labels', () => {

    const getLanguages = () => ['de'];
    let projectConfiguration;


    beforeAll(() => {

        projectConfiguration = jasmine.createSpyObj('projectConfiguration', ['getRelations']);
        projectConfiguration.getRelations.and.returnValue([]);
    });


    it('should get field label', () => {

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

        const labels = new Labels(getLanguages, projectConfiguration);

        expect(labels.getFieldLabel(category, 'aField')).toBe('Ein Feld');
    });


    it('should get default field label if not defined', () => {

        const category = {
            name: 'T',
            groups: [{
                fields: [{
                    name: 'aField'
                }]
            }]
        } as any;

        const labels = new Labels(getLanguages, projectConfiguration);
        expect(labels.getFieldLabel(category,'aField')).toBe('aField');
    });


    it('should get relation label', () => {

        const relation: Relation = {
            name: 'aRelation',
            label: { de: 'Eine Relation' },
            domain: ['T'],
            range: ['T'],
            inputType: 'relation'
        }

        projectConfiguration.getRelations.and.returnValue([relation]);

        const labels = new Labels(getLanguages, projectConfiguration);
        expect(labels.getRelationLabel('aRelation')).toBe('Eine Relation');
    });


    it('should get default relation label if not defined', () => {

        const relation: Relation = {
            name: 'aRelation',
            domain: ['T'],
            range: ['T'],
            inputType: 'relation'
        }

        projectConfiguration.getRelations.and.returnValue([relation]);

        const labels = new Labels(getLanguages, projectConfiguration);
        expect(labels.getRelationLabel('aRelation')).toBe('aRelation');
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

        const labels = new Labels(getLanguages, projectConfiguration);
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

        const labels = new Labels(getLanguages, projectConfiguration);
        expect(labels.orderKeysByLabels(valuelist)).toEqual(['2', '4', '3', '1']);
    });
});
