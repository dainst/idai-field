import {DefaultImportCalc} from "../../../../../app/core/import/exec/default-import-calc";
import {ImportErrors as E} from "../../../../../app/core/import/exec/import-errors";

/**
 * @author Daniel de Oliveira
 */
describe('DefaultImportCalc', () => {


    let validator;

    let opTypeNames = ['Trench'];

    const existingTrench = {resource: {type: 'Trench', identifier: 'existingTrench', id: 'et1', relations:{ }}};
    const existingFeature = {resource: {type: 'Feature', identifier: 'existingFeature', id: 'ef1', relations:{ isRecordedIn: ['et1']}}};

    let returnUndefined = () => undefined;

    let generateId = () => { resourceIdCounter++; return '10' + resourceIdCounter.toString() };
    let get = async (resourceId): Promise<any> => {

        if (resourceId === 'ef1') return existingFeature;
        if (resourceId === 'et1') return existingTrench;
        else throw 'missing';
    };
    let find = async (_: any): Promise<any> => {

        if (_ === 'existingTrench') return existingTrench;
        if (_ === 'existingFeature') return existingFeature;
        return undefined;
    };


    let resourceIdCounter;
    let process;
    let processWithMainType;


    beforeEach(() => {

        resourceIdCounter = 0;

        validator = jasmine.createSpyObj('validator', [
            'assertIsRecordedInTargetsExist', 'assertIsWellformed',
            'assertIsKnownType', 'assertHasLiesWithin', 'assertIsAllowedType',
            'assertSettingIsRecordedInIsPermissibleForType',
            'assertIsNotOverviewType', 'isRecordedInTargetAllowedRelationDomainType', 'assertNoForbiddenRelations']);

        process = DefaultImportCalc.build(validator, opTypeNames, generateId, find, get, returnUndefined,
            false,
            false,
            '',
            true);

        processWithMainType = DefaultImportCalc.build(validator, opTypeNames, generateId, find, get, returnUndefined,
            false,
            false,
            'et1',
            true);
    });


    it('child of existing operation', async done => {

        const result = await process(<any>[
            { resource: {type: 'Feature', identifier: 'newFeature', relations: { parent: 'existingTrench' }}}
            ]);

        const resource = result[0][0].resource;
        expect(resource.id).toBe('101');
        expect(resource.relations['isRecordedIn'][0]).toBe('et1');
        expect(resource.relations['liesWithin']).toBeUndefined();
        done();
    });


    it('child of existing feature', async done => {

        const result = await process(<any>[
            { resource: {type: 'Feature', identifier: 'newFeature', relations: { parent: 'existingFeature' }}}
        ]);

        const resource = result[0][0].resource;
        expect(resource.id).toBe('101'); // // includes must also be set
        expect(resource.relations['isRecordedIn'][0]).toEqual('et1');
        expect(resource.relations['liesWithin'][0]).toEqual('ef1');
        done();
    });


    it('import operation', async done => {

        const result = await process(<any>[
            { resource: {type: 'Trench', identifier: 'zero', relations: {}}}
        ]);

        const resource = result[0][0].resource;
        expect(resource.identifier).toBe('zero');
        expect(resource.relations['isRecordedIn']).toBeUndefined();
        expect(resource.relations['liesWithin']).toBeUndefined();
        done();
    });


    it('import operation including feature', async done => {

        const result = await process([
            { resource: {type: 'Trench', identifier: 'one', relations: {}}},
            { resource: {type: 'Feature', identifier: 'two', relations: { parent: 'one' }}} as any]);

        const resource = result[0][1].resource;
        expect(resource.identifier).toBe('two');
        expect(resource.relations['isRecordedIn'][0]).toBe('101');
        expect(resource.relations['liesWithin']).toBeUndefined();
        done();
    });


    it('import feature as child of existing operation', async done => {

        const result = await process(<any>[
            { resource: {type: 'Feature', identifier: 'one', relations: { parent: 'existingTrench' }}}
        ]);

        const resource = result[0][0].resource;
        expect(resource.id).toBe('101');
        expect(resource.relations['isRecordedIn'][0]).toBe('et1');
        expect(resource.relations['liesWithin']).toBeUndefined();
        done();
    });


    it('import feature as child of existing operation, via parameter', async done => {

        const result = await processWithMainType(<any>[
            { resource: {type: 'Feature', identifier: 'one', relations: {}}}
        ]);

        const resource = result[0][0].resource;
        expect(resource.id).toBe('101');
        expect(resource.relations['isRecordedIn'][0]).toBe('et1');
        expect(resource.relations['liesWithin']).toBeUndefined();
        done();
    });


    // TODO import operation and feature, all from import


    it('assignment to existing operation via lies within, nested resources from import', async done => {

        const result = await process([
            { resource: {type: 'Feature', identifier: 'one', relations: { parent: 'existingTrench' }}},
            { resource: {type: 'Find', identifier: 'three', relations: { parent: 'two' }}},
            // crucially, allow to define things in an arbitrary order (three forward references two) TODO make separate test for this, the first and the second test then can work with only two resources each
            { resource: {type: 'Feature', identifier: 'two', relations: { parent: 'one' }}} as any]);

        expect(result[0][0].resource.id).toBe('101');
        expect(result[0][0].resource.relations['isRecordedIn'][0]).toBe('et1');
        expect(result[0][0].resource.relations['liesWithin']).toBeUndefined();
        expect(result[0][1].resource.id).toBe('102');
        expect(result[0][1].resource.relations['liesWithin'][0]).toBe('103');
        expect(result[0][1].resource.relations['isRecordedIn'][0]).toBe('et1');
        expect(result[0][2].resource.id).toBe('103');
        expect(result[0][2].resource.relations['liesWithin'][0]).toBe('101');
        expect(result[0][2].resource.relations['isRecordedIn'][0]).toBe('et1');
        done();
    });


    it('assignment to existing operation via parameter, nested resources from import', async done => {

        const result = await processWithMainType([
            { resource: {type: 'Feature', identifier: 'one', relations: {}}},
            { resource: {type: 'Find', identifier: 'three', relations: { parent: 'two' }}},
            // crucially, allow to define things in an arbitrary order (three forward references two)
            { resource: {type: 'Feature', identifier: 'two', relations: { parent: 'one' }}} as any]);

        expect(result[0][0].resource.id).toBe('101');
        expect(result[0][0].resource.relations['isRecordedIn'][0]).toBe('et1');
        expect(result[0][0].resource.relations['liesWithin']).toBeUndefined();
        expect(result[0][1].resource.id).toBe('102');
        expect(result[0][1].resource.relations['liesWithin'][0]).toBe('103');
        expect(result[0][1].resource.relations['isRecordedIn'][0]).toBe('et1');
        expect(result[0][2].resource.id).toBe('103');
        expect(result[0][2].resource.relations['liesWithin'][0]).toBe('101');
        expect(result[0][2].resource.relations['isRecordedIn'][0]).toBe('et1');
        done();
    });


    it('assignment to existing operation via parameter, also nested in existing', async done => {

        const result = await processWithMainType([
            {resource: {type: 'Feature', identifier: 'one', relations: {parent: 'existingFeature'}}} as any]);

        expect(result[0][0].resource.id).toBe('101');
        expect(result[0][0].resource.relations['isRecordedIn'][0]).toBe('et1');
        expect(result[0][0].resource.relations['liesWithin'][0]).toBe('ef1');
        done();
    });


    // TODO assignment to existing feature, recorded in mismatch because of assignment via parameter


    it('clash of assigned main type id with use of parent', async done => {

        const result = await processWithMainType([{ resource:
            {type: 'Feature', identifier: 'one', relations: { parent: 'existingTrench' }}} as any]);
        expect(result[2][0]).toEqual(E.PARENT_ASSIGNMENT_TO_OPERATIONS_NOT_ALLOWED);
        done();
    });


    it('parent is an array', async done => {

        const result = await process([{ resource:
            {type: 'Feature', identifier: 'one', relations: { parent: [] }}} as any]);
        expect(result[2][0]).toEqual(E.PARENT_MUST_NOT_BE_ARRAY);
        expect(result[2][1]).toEqual('one');
        done();
    });


    it('missing liesWithin and no operation assigned', async done => {

        validator.assertHasLiesWithin.and.throwError('E');

        const result = await process([{ resource: {type: 'Feature', identifier: 'one', relations: {}}} as any]);
        expect(result[2][0]).toEqual(E.NO_LIES_WITHIN_SET);
        done();
    });


    it('forbidden relation', async done => {

        const result = await process([{ resource: {type: 'Feature', identifier: 'one', relations: { includes: [] }}} as any]);
        expect(result[2][0]).toEqual(E.INVALID_RELATIONS);
        expect(result[2][2]).toEqual('includes');
        done();
    });
});