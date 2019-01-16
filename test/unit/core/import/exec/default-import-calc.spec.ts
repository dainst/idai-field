import {DefaultImportCalc} from "../../../../../app/core/import/exec/default-import-calc";

/**
 * @author Daniel de Oliveira
 */
describe('DefaultImportCalc', () => {


    let mockValidator;

    let operationTypeNames = ['Trench'];

    let generateId = () => { i++; return '10' + i.toString() };
    let get = async resourceId => {

        if (resourceId === '0') return { resource: { id: '0', identifier: '0', type: 'Trench' }} as any;
        else throw 'missing';
    };

    let i;


    beforeEach(() => {
        i = 0;
        mockValidator = jasmine.createSpyObj('validator', [
            'assertIsRecordedInTargetsExist', 'assertIsWellformed',
            'assertIsKnownType', 'assertHasLiesWithin', 'assertIsAllowedType',
            'assertSettingIsRecordedInIsPermissibleForType',
            'assertIsNotOverviewType', 'isRecordedInTargetAllowedRelationDomainType']);

    });


    it('assignment to existing operation via lies within, nested resources from import', async done => {

        let findCall = 0;
        const process = DefaultImportCalc.build(
            mockValidator,
            operationTypeNames,
            generateId,
            async (_: any) => (
                findCall++,
                findCall === 1
                    ? {resource: {type: 'Trench', identifier: 'zero', id: '0'}} as any
                    : undefined),
            get,
            () => undefined,
            false,
            false,
            '',
            true);

        const result = await process([
            { resource: {type: 'Feature', identifier: 'one', relations: { liesWithin: ['zero'] }}},
            { resource: {type: 'Find', identifier: 'three', relations: { liesWithin: ['two'] }}},
            // crucially, allow to define things in an arbitrary order (three forward references two)
            { resource: {type: 'Feature', identifier: 'two', relations: { liesWithin: ['one'] }}} as any]);

        
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


    it('assignment to existing operation via paramter, nested resources from import', async done => {

        let findCall = 0;
        const process = DefaultImportCalc.build(
            mockValidator,
            operationTypeNames,
            generateId,
            async (_: any) => {
                findCall++;
                return undefined;
            },
            get,
            () => undefined,
            false,
            false,
            '0',
            true);

        const result = await process([
            { resource: {type: 'Feature', identifier: 'one', relations: {}}},
            { resource: {type: 'Find', identifier: 'three', relations: { liesWithin: ['two'] }}},
            // crucially, allow to define things in an arbitrary order (three forward references two)
            { resource: {type: 'Feature', identifier: 'two', relations: { liesWithin: ['one'] }}} as any]);

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
});