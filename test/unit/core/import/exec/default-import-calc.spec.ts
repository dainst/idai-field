import {DefaultImportCalc} from "../../../../../app/core/import/exec/default-import-calc";
import {ImportErrors} from "../../../../../app/core/import/exec/import-errors";

/**
 * @author Daniel de Oliveira
 */
describe('DefaultImportCalc', () => {


    let mockValidator;

    let operationTypeNames = ['Trench'];

    let returnUndefined = () => undefined;
    let asyncReturnUndefined = async (_: any) => undefined;
    let generateId = () => { i++; return '10' + i.toString() };
    let get = async resourceId => {

        if (resourceId === '0') return { resource: { id: '0', identifier: '0', type: 'Trench' }} as any;
        if (resourceId === '1') return { resource: { id: '1', identifier: '1', type: 'Feature', relations: { isRecordedIn: ['0']} }} as any;
        else throw 'missing';
    };

    let i;


    beforeEach(() => {
        i = 0;
        mockValidator = jasmine.createSpyObj('validator', [
            'assertIsRecordedInTargetsExist', 'assertIsWellformed',
            'assertIsKnownType', 'assertHasLiesWithin', 'assertIsAllowedType',
            'assertSettingIsRecordedInIsPermissibleForType',
            'assertIsNotOverviewType', 'isRecordedInTargetAllowedRelationDomainType', 'assertNoForbiddenRelations']);

    });


    it('assignment to existing operation via lies within, nested resources from import', async done => {

        let findCall = 0;
        const process = DefaultImportCalc.build(mockValidator, operationTypeNames,
            generateId,
            async (_: any) => (
                findCall++,
                findCall === 1
                    ? {resource: {type: 'Trench', identifier: 'zero', id: '0'}} as any
                    : undefined),
            get,
            returnUndefined,
            false,
            false,
            '',
            true);

        const result = await process([
            { resource: {type: 'Feature', identifier: 'one', relations: { parent: 'zero' }}},
            { resource: {type: 'Find', identifier: 'three', relations: { parent: 'two' }}},
            // crucially, allow to define things in an arbitrary order (three forward references two) TODO make separate test for this, the first and the second test then can work with only two resources each
            { resource: {type: 'Feature', identifier: 'two', relations: { parent: 'one' }}} as any]);

        
        expect(result[0][0].resource.id).toBe('101');
        expect(result[0][0].resource.relations['isRecordedIn'][0]).toBe('0');
        expect(result[0][0].resource.relations['liesWithin']).toBeUndefined();
        expect(result[0][1].resource.id).toBe('102');
        expect(result[0][1].resource.relations['liesWithin'][0]).toBe('103');
        expect(result[0][1].resource.relations['isRecordedIn'][0]).toBe('0');
        expect(result[0][2].resource.id).toBe('103');
        expect(result[0][2].resource.relations['liesWithin'][0]).toBe('101');
        expect(result[0][2].resource.relations['isRecordedIn'][0]).toBe('0');
        done();
    });


    it('assignment to existing operation via parameter, nested resources from import', async done => {

        let findCall = 0;
        const process = DefaultImportCalc.build(mockValidator, operationTypeNames,
            generateId,
            async (_: any) => {
                findCall++;
                return undefined;
            },
            get,
            returnUndefined,
            false,
            false,
            '0',
            true);

        const result = await process([
            { resource: {type: 'Feature', identifier: 'one', relations: {}}},
            { resource: {type: 'Find', identifier: 'three', relations: { parent: 'two' }}},
            // crucially, allow to define things in an arbitrary order (three forward references two)
            { resource: {type: 'Feature', identifier: 'two', relations: { parent: 'one' }}} as any]);

        expect(result[0][0].resource.id).toBe('101');
        expect(result[0][0].resource.relations['isRecordedIn'][0]).toBe('0');
        expect(result[0][0].resource.relations['liesWithin']).toBeUndefined();
        expect(result[0][1].resource.id).toBe('102');
        expect(result[0][1].resource.relations['liesWithin'][0]).toBe('103');
        expect(result[0][1].resource.relations['isRecordedIn'][0]).toBe('0');
        expect(result[0][2].resource.id).toBe('103');
        expect(result[0][2].resource.relations['liesWithin'][0]).toBe('101');
        expect(result[0][2].resource.relations['isRecordedIn'][0]).toBe('0');
        done();
    });


    // TODO add testfile for manual tests
    it('assignment to existing operation via parameter, nested resources from import', async done => {

        let findCall = 0;
        const process = DefaultImportCalc.build(mockValidator, operationTypeNames,
            generateId,
                async (_: any) => (
                    findCall++,
                        findCall === 1
                            ? {resource: {type: 'Feature', identifier: '1', id: '1', relations:{}}} as any
                            : undefined),
            get,
            returnUndefined,
            false,
            false,
            '0',
            true);

        const result = await process([
            { resource: {type: 'Feature', identifier: 'one', relations: { parent: '1' }}} as any]);

        expect(result[0][0].resource.id).toBe('101');
        expect(result[0][0].resource.relations['isRecordedIn'][0]).toBe('0');
        expect(result[0][0].resource.relations['liesWithin'][0]).toBe('1');
        done();
    });


    // TODO assignment to existing feature, recorded in mismatch because of assignment via parameter


    it('import operation including feature', async done => {

        let findCall = 0;
        const process = DefaultImportCalc.build(mockValidator, operationTypeNames,
            generateId,
            asyncReturnUndefined,
            get,
            returnUndefined,
            false,
            false,
            '',
            true);

        const result = await process([
            { resource: {type: 'Feature', identifier: 'one', relations: { parent: 'zero' }}},
            { resource: {type: 'Trench', identifier: 'zero', relations: {}}} as any]);

        expect(result[0][0].resource.identifier).toBe('one');
        expect(result[0][0].resource.relations['isRecordedIn'][0]).toBe('102');
        expect(result[0][0].resource.relations['liesWithin']).toBeUndefined();
        expect(result[0][1].resource.identifier).toBe('zero');
        expect(result[0][1].resource.relations['isRecordedIn']).toBeUndefined();
        expect(result[0][1].resource.relations['liesWithin']).toBeUndefined();
        done();
    });


    it('missing liesWithin and no operation assigned', async done => {

        mockValidator.assertHasLiesWithin.and.throwError('E');

        const process = DefaultImportCalc.build(mockValidator, operationTypeNames,
            generateId, asyncReturnUndefined, get, returnUndefined,
            false,
            false,
            '',
            true);

        try {
            await process([{ resource: {type: 'Feature', identifier: 'one', relations: {}}} as any]);
            fail();
        } catch (e) {
            expect(e[0]).toEqual(ImportErrors.NO_LIES_WITHIN_SET);
        }
        done();
    });


    it('forbidden relation', async done => {

        const process = DefaultImportCalc.build(mockValidator, operationTypeNames,
            generateId, asyncReturnUndefined, get, returnUndefined,
            false,
            false,
            '',
            true);

        try {
            await process([{ resource: {type: 'Feature', identifier: 'one', relations: { includes: [] }}} as any]);
            fail();
        } catch (e) {
            expect(e[0]).toEqual(ImportErrors.INVALID_RELATIONS);
            expect(e[2]).toEqual('includes');
        }
        done();
    });
});