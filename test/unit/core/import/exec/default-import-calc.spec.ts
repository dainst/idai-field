import {DefaultImportCalc} from "../../../../../app/core/import/exec/default-import-calc";
import {ImportErrors as E} from "../../../../../app/core/import/exec/import-errors";

/**
 * @author Daniel de Oliveira
 */
describe('DefaultImportCalc', () => {


    let validator;

    let opTypeNames = ['Trench'];

    const existingTrench = {resource: {type: 'Trench', identifier: 'existingTrench', id: 'et1', relations:{ }}};
    const existingTrench2 = {resource: {type: 'Trench', identifier: 'existingTrench2', id: 'et2', relations:{ }}};
    const existingFeature = {resource: {type: 'Feature', identifier: 'existingFeature', id: 'ef1', relations:{ isRecordedIn: ['et1']}}};
    const existingFeature2 = {resource: {type: 'Feature', identifier: 'existingFeature2', id: 'ef2', relations:{ isRecordedIn: ['et2']}}};

    let returnUndefined = () => undefined;

    let generateId = () => { resourceIdCounter++; return '10' + resourceIdCounter.toString() };
    let get = async (resourceId): Promise<any> => {

        if (resourceId === 'ef1') return existingFeature;
        if (resourceId === 'ef2') return existingFeature2;
        if (resourceId === 'et1') return existingTrench;
        if (resourceId === 'et2') return existingTrench2;
        else throw 'missing';
    };
    let find = async (_: any): Promise<any> => {

        if (_ === 'existingTrench') return existingTrench;
        if (_ === 'existingTrench2') return existingTrench2;
        if (_ === 'existingFeature') return existingFeature;
        if (_ === 'existingFeature2') return existingFeature2;
        return undefined;
    };


    let resourceIdCounter;
    let process;
    let processWithMainType;
    let processWithPlainIds;


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

        processWithPlainIds = DefaultImportCalc.build(validator, opTypeNames, generateId, find, get, returnUndefined,
            false,
            false,
            '',
            false);
    });


    // TODO test that includes relation gets not set


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
        expect(resource.id).toBe('101');
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


    it('import operation including feature, order reversed', async done => {

        const result = await process([
            { resource: {type: 'Feature', identifier: 'two', relations: { parent: 'one' }}},
            { resource: {type: 'Trench', identifier: 'one', relations: {}}} as any]);

        const resource = result[0][0].resource;
        expect(resource.identifier).toBe('two');
        expect(resource.relations['isRecordedIn'][0]).toBe('102');
        expect(resource.relations['liesWithin']).toBeUndefined();
        done();
    });


    it('import operation including feature, nest deeper', async done => {

        const result = await process(<any>[
            { resource: {type: 'Trench', identifier: 'one', relations: {}}},
            { resource: {type: 'Feature', identifier: 'two', relations: { parent: 'one' }}},
            { resource: {type: 'Find', identifier: 'three', relations: { parent: 'two' }}}
        ]);

        const resource = result[0][2].resource;
        expect(resource.identifier).toBe('three');
        expect(resource.relations['isRecordedIn'][0]).toBe('101');
        expect(resource.relations['liesWithin'][0]).toEqual('102');
        done();
    });


    it('import operation including feature, nest deeper, order reversed', async done => {

        const result = await process(<any>[
            { resource: {type: 'Find', identifier: 'three', relations: { parent: 'two' }}},
            { resource: {type: 'Feature', identifier: 'two', relations: { parent: 'one' }}},
            { resource: {type: 'Trench', identifier: 'one', relations: {}}},
        ]);

        const resource = result[0][0].resource;
        expect(resource.identifier).toBe('three');
        expect(resource.relations['isRecordedIn'][0]).toBe('103');
        expect(resource.relations['liesWithin'][0]).toEqual('102');
        done();
    });


    it('import feature as child of existing operation', async done => {

        const result = await process(<any>[
            { resource: {type: 'Feature', identifier: 'one', relations: { parent: 'existingTrench' }}}
        ]);

        const resource = result[0][0].resource;
        expect(resource.relations['isRecordedIn'][0]).toBe('et1');
        expect(resource.relations['liesWithin']).toBeUndefined();
        done();
    });


    it('import feature as child of existing operation, via operation assignment parameter', async done => {

        const result = await processWithMainType(<any>[
            { resource: {type: 'Feature', identifier: 'one', relations: {}}}
        ]);

        const resource = result[0][0].resource;
        expect(resource.relations['isRecordedIn'][0]).toBe('et1');
        expect(resource.relations['liesWithin']).toBeUndefined();
        done();
    });


    it('nested resources, topmost child of existing operation', async done => {

        const result = await process(<any>[
            { resource: {type: 'Feature', identifier: 'one', relations: { parent: 'existingTrench' }}},
            { resource: {type: 'Find', identifier: 'two', relations: { parent: 'one' }}}
        ]);

        expect(result[0][0].resource.relations['isRecordedIn'][0]).toBe('et1');
        expect(result[0][0].resource.relations['liesWithin']).toBeUndefined();
        expect(result[0][1].resource.relations['isRecordedIn'][0]).toBe('et1');
        expect(result[0][1].resource.relations['liesWithin'][0]).toBe('101');
        done();
    });


    it('nested resources, topmost child of existing operation, order reversed', async done => {

        const result = await process(<any>[
            { resource: {type: 'Find', identifier: 'two', relations: { parent: 'one' }}},
            { resource: {type: 'Feature', identifier: 'one', relations: { parent: 'existingTrench' }}}
        ]);

        expect(result[0][0].resource.relations['isRecordedIn'][0]).toBe('et1');
        expect(result[0][0].resource.relations['liesWithin'][0]).toBe('102');
        expect(result[0][1].resource.relations['isRecordedIn'][0]).toBe('et1');
        expect(result[0][1].resource.relations['liesWithin']).toBeUndefined();
        done();
    });


    it('nested resources, assignment to operation via operation assignment parameter', async done => {

        const result = await processWithMainType([
            { resource: {type: 'Feature', identifier: 'one', relations: {}}},
            { resource: {type: 'Find', identifier: 'two', relations: { parent: 'one' }}} as any]);

        expect(result[0][0].resource.relations['isRecordedIn'][0]).toBe('et1');
        expect(result[0][0].resource.relations['liesWithin']).toBeUndefined();
        expect(result[0][1].resource.relations['isRecordedIn'][0]).toBe('et1');
        expect(result[0][1].resource.relations['liesWithin'][0]).toBe('101');
        done();
    });


    it('nested resources, assignment to operation via operation assignment parameter, order reversed', async done => {

        const result = await processWithMainType(<any>[
            { resource: {type: 'Find', identifier: 'two', relations: { parent: 'one' }}},
            { resource: {type: 'Feature', identifier: 'one', relations: {}}}
        ]);

        expect(result[0][0].resource.relations['isRecordedIn'][0]).toBe('et1');
        expect(result[0][0].resource.relations['liesWithin'][0]).toBe('102');
        expect(result[0][1].resource.relations['isRecordedIn'][0]).toBe('et1');
        expect(result[0][1].resource.relations['liesWithin']).toBeUndefined();
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


    it('assignment to existing feature, via mismatch with operation assignment parameter , ', async done => {

        const result = await processWithMainType([
            {resource: {type: 'Feature', identifier: 'one', relations: { parent: 'existingFeature2' }}} as any]);

        expect(result[2][0]).toEqual(E.LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN);
        expect(result[2][1]).toEqual('one');
        done();
    });


    // err cases ///////////////////////////////////////////////////////////////////////////////////////////////////////

    it('duplicate identifiers in import file', async done => {

        const result = await process(<any>[
            { resource: {type: 'Feature', identifier: 'dup', relations: { parent: 'et1' }}},
            { resource: {type: 'Feature', identifier: 'dup', relations: { parent: 'et1' }}}
        ]);

        const error = result[2];
        expect(error[0]).toEqual(E.DUPLICATE_IDENTIFIER);
        expect(error[1]).toEqual('dup');
        done();
    });


    it('duplicate identifiers, resource with such identifier already exists', async done => {

        const result = await process(<any>[
            { resource: {type: 'Feature', identifier: 'existingFeature', relations: { parent: 'existingTrench' }}},
        ]);

        const error = result[2];
        expect(error[0]).toEqual(E.RESOURCE_EXISTS);
        expect(error[1]).toEqual('existingFeature');
        done();
    });


    it('parent not found', async done => {

        const result = await process(<any>[
            { resource: {type: 'Feature', identifier: 'zero', relations: { parent: 'notfound' }}}
        ]);

        expect(result[2][0]).toEqual(E.MISSING_RELATION_TARGET);
        expect(result[2][1]).toEqual('notfound');
        done();
    });


    it('parent not found, when using plain ids', async done => {

        const result = await processWithPlainIds(<any>[
            { resource: {type: 'Feature', identifier: 'zero', relations: { parent: 'notfound' }}},
        ]);

        expect(result[2][0]).toEqual(E.MISSING_RELATION_TARGET);
        expect(result[2][1]).toEqual('notfound');
        done();
    });


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