import {ProjectConfiguration, FindResult} from 'idai-components-2';
import {Validator} from '../../../../app/core/model/validator';
import {TypeUtility} from '../../../../app/core/model/type-utility';
import {ValidationErrors} from '../../../../app/core/model/validation-errors';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('Validator', () => {

    const projectConfiguration = new ProjectConfiguration(
        {
            types: [
                {
                    type: 'T',
                    fields: [
                        {name: 'id',},
                        {name: 'identifier'},
                        {name: 'type',},
                        {name: 'optional'},
                        {name: 'mandatory', mandatory: true},
                        {name: 'number1', label: 'number1', inputType: 'float'},
                        {name: 'number2', label: 'number2', inputType: 'float'}
                    ]
                },
                {
                    type: 'T2',
                    fields: [
                        {name: 'id',},
                        {name: 'type',}
                    ]
                },
            ],
            relations: [
                {name: 'isRelatedTo', domain: ['T'], range: ['T'], inverse: 'NO-INVERSE'},
                {name: 'isDepictedIn', domain: ['T'], range: ['T2'], inverse: 'NO-INVERSE'},
                {name: 'isRecordedIn', domain: ['T'], range: ['T2'], inverse: 'NO-INVERSE'}
            ]
        }
    );


    it('should report nothing', async done => {

        const find = () => Promise.resolve({totalCount: 0, documents: []});

        const doc = {
            resource: {
                id: '1',
                type: 'T',
                mandatory: 'm',
                relations: {
                    isRelatedTo: ['2']
                },
            }
        };
        await new Validator(projectConfiguration, find, new TypeUtility(projectConfiguration))
            .assertIsRecordedInTargetsExist(doc).then(() => done(), msgWithParams => fail(msgWithParams));
        done();
    });


    it('should report missing isRecordedInTarget', async done => {

        const find = () => Promise.resolve({ documents: [] } as FindResult);

        const doc = {resource: {id: '1', type: 'T', mandatory: 'm', relations: {'isRecordedIn': ['notexisting']}}};

        try {
            await new Validator(projectConfiguration, find, new TypeUtility(projectConfiguration))
                .assertIsRecordedInTargetsExist(doc);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ValidationErrors.NO_ISRECORDEDIN_TARGET, 'notexisting']);
        }
        done();
    });


    it('should report duplicate identifier', async done => {

        const find = () =>
            Promise.resolve({totalCount: 1, documents: [{resource: {id: '2', identifier: 'eins' }}]} as unknown as FindResult);

        const doc = {
            resource: {
                id: '1', identifier: 'eins', type: 'T', mandatory: 'm', relations: {'isRecordedIn': []}}
        };

        try {
            await new Validator(projectConfiguration, find, new TypeUtility(projectConfiguration)).assertIdentifierIsUnique(doc);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ValidationErrors.IDENTIFIER_ALREADY_EXISTS, 'eins']);
        }
        done();
    });
});
