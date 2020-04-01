import {Map} from 'tsfun';
import {RelationDefinition} from '../../../../../app/core/configuration/model/relation-definition';
import {LibraryCategoryDefinition} from '../../../../../app/core/configuration/model/library-category-definition';
import {addRelations} from '../../../../../app/core/configuration/boot/add-relations';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('addRelations', () => {

    let configuration;
    let t1: LibraryCategoryDefinition;

    beforeEach(() => {

        t1 = {
            categoryName: 'x1',
            commons: [],
            parent: 'x',
            description: { 'de': '' },
            createdBy: '',
            creationDate: '',
            color: 'white',
            valuelists: {},
            fields: {
                'aField': {}
            }
        } as LibraryCategoryDefinition;

        configuration = {
            identifier: 'test',
            categories: {
                'T1': t1
            } as Map<LibraryCategoryDefinition>
        } as any;
    });


    it('add an extra relation', () => {

        const extraRelation: RelationDefinition = {
            name: 'R',
            label: '',
            domain: ['domainA'],
            range : ['rangeA']
        };
        configuration.relations = [];

        configuration = addRelations([extraRelation])(configuration);

        expect(configuration.relations[0].name).toBe('R');
        expect(configuration.relations[1]).toBe(undefined); // to prevent reintroducing bug
    });


    it('overwrite relation for a part of a domain', () => {

        const r1: RelationDefinition = {
            name: 'R',
            label: '',
            domain: ['domainA', 'domainB', 'domainC'],
            range : ['rangeA']
        };

        const r2: RelationDefinition = {
            name: 'R',
            label: '',
            domain: ['domainB', 'domainC'],
            range : ['rangeB']
        };

        configuration = { identifier: 'test', categories: { T1: t1 }, relations: []};

        configuration = addRelations([r1, r2])(configuration);
        expect(configuration.relations[0].domain).toContain('domainB');
        expect(configuration.relations[0].domain).toContain('domainC');
        expect(configuration.relations[0].range).toContain('rangeB');

        expect(configuration.relations[1].domain).toContain('domainA');
        expect(configuration.relations[1].range).toContain('rangeA');
    });


    it('overwrite relation with inheritance for a part of a domain', () => {

        const r1: RelationDefinition = {
            name: 'R',
            label: '',
            domain: ['T1:inherit'],
            range : ['rangeA']
        };

        const r2: RelationDefinition = {
            name: 'R',
            label: '',
            domain: ['T1:inherit'],
            range : ['rangeA', 'rangeB', 'rangeC']
        };

        configuration = { identifier: 'test', categories: { T1: t1 }, relations: []};

        configuration = addRelations([r1, r2])(configuration);

        expect(configuration.relations.length).toEqual(1); // to make sure the relation is collapsed into one
        expect(configuration.relations[0].range).toContain('rangeA');
        expect(configuration.relations[0].range).toContain('rangeB');
        expect(configuration.relations[0].range).toContain('rangeC');
    });


    it('replace range ALL with all categories except the domain categories', () => {

        const r: RelationDefinition = {
            name: 'R',
            label: '',
            domain: ['T2', 'T3']
        };

        configuration.relations = [];

        configuration = addRelations([r])(configuration);

        expect(configuration.relations[0].range[0]).toBe('T1');
        expect(configuration.relations[0].range[1]).toBe(undefined);
    });


    it('should replace domain ALL with all categories except the range categories', () => {

        const r: RelationDefinition = {
            name: 'R',
            label: '',
            range: ['T2', 'T3']
        };

        configuration.relations = [];

        configuration = addRelations([r])(configuration);

        expect(configuration.relations[0].domain[0]).toBe('T1');
        expect(configuration.relations[0].domain[1]).toBe(undefined);
    });


    it('should replace range :inherit with all subcategories', () => {

        const r: RelationDefinition = { name: 'R',
            domain: [ 'T3' ],
            label: '',
            range: [ 'T1:inherit' ]
        };

        configuration.relations = [];
        configuration.categories['T2'] = { fields: {}, parent: 'T1' };
        configuration.categories['T3'] = { fields: {} };

        configuration = addRelations([r])(configuration);

        expect(configuration.relations[0].range.indexOf('T1')).not.toBe(-1);
        expect(configuration.relations[0].range.indexOf('T2')).not.toBe(-1);
        expect(configuration.relations[0].range.indexOf('T1:inherit')).toBe(-1);
        expect(configuration.relations[0].domain[0]).toBe('T3');
    });


    it('should replace domain :inherit with all subcategories', function() {

        const r: RelationDefinition = {
            name: 'R',
            label: '',
            domain: [ 'T1:inherit' ],
            range: [ 'T3' ]
        };

        configuration.relations = [];
        configuration.categories['T2'] = { fields: {}, parent: 'T1' };
        configuration.categories['T3'] = { fields: {} };

        configuration = addRelations([r])(configuration);

        expect(configuration.relations[0].domain.indexOf('T1')).not.toBe(-1);
        expect(configuration.relations[0].domain.indexOf('T2')).not.toBe(-1);
        expect(configuration.relations[0].domain.indexOf('T1:inherit')).toBe(-1);
        expect(configuration.relations[0].range[0]).toBe('T3');
    });


    // This test can detect problems coming from a wrong order of expandInherits and expandAllMarker calls
    it('should exclude the category and subcategories when using :inherit and total range', function() {

        const r: RelationDefinition = {
            name: 'R',
            label: '',
            domain: [ 'T1:inherit' ]
        };

        configuration.relations = [];
        configuration.categories['T2'] = { fields: {}, parent: 'T1' };
        configuration.categories['T3'] = { fields: {} };
        configuration = addRelations([r])(configuration);

        expect(configuration.relations[0].range[0]).toBe('T3');
        expect(configuration.relations[0].range.indexOf('T1')).toBe(-1);
        expect(configuration.relations[0].range.indexOf('T2')).toBe(-1);
    });
});