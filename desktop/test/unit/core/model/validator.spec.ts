import { FindResult } from 'idai-field-core';
import { ProjectConfiguration } from '../../../../src/app/core/configuration/project-configuration';
import { ValidationErrors } from '../../../../src/app/core/model/validation-errors';
import { Validator } from '../../../../src/app/core/model/validator';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('Validator', () => {

    const projectConfiguration = new ProjectConfiguration(
        [
            [
                { item: {
                    name: 'T',
                    groups: [
                        {
                            name: 'G',
                            fields: [
                                { name: 'id' },
                                { name: 'identifier' },
                                { name: 'category' },
                                { name: 'optional' },
                                { name: 'mandatory', mandatory: true },
                                { name: 'number1', label: 'number1', inputType: 'float' },
                                { name: 'number2', label: 'number2', inputType: 'float' }
                            ]
                        }
                    ]
                }, trees: []},
                { item: {
                    name: 'T2',
                    groups: [
                        {
                            name: 'G',
                            fields: [
                                { name: 'id' },
                                { name: 'category' }
                            ]
                        }
                    ]
                }, trees: []}
            ],
            []
        ] as any
    );


    it('should report nothing', async done => {

        const find = () => Promise.resolve({ documents: [], ids: [], totalCount: 0 });

        const doc = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                relations: {
                    isRelatedTo: ['2']
                },
            }
        };
        await new Validator(projectConfiguration, find)
            .assertIsRecordedInTargetsExist(doc).then(() => done(), msgWithParams => fail(msgWithParams));
        done();
    });


    it('should report missing isRecordedInTarget', async done => {

        const find = () => Promise.resolve({ documents: [] } as FindResult);

        const doc = { resource: { id: '1', category: 'T', mandatory: 'm', relations: { 'isRecordedIn': ['notexisting'] } } };

        try {
            await new Validator(projectConfiguration, find)
                .assertIsRecordedInTargetsExist(doc);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ValidationErrors.NO_ISRECORDEDIN_TARGET, 'notexisting']);
        }
        done();
    });


    it('should report duplicate identifier', async done => {

        const find = () =>
            Promise.resolve(
                { totalCount: 1, documents: [{ resource: { id: '2', identifier: 'eins' } }] } as unknown as FindResult
            );

        const doc = {
            resource: {
                id: '1', identifier: 'eins', category: 'T', mandatory: 'm', relations: { 'isRecordedIn': [] }
            }
        };

        try {
            await new Validator(projectConfiguration, find)
                .assertIdentifierIsUnique(doc);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ValidationErrors.IDENTIFIER_ALREADY_EXISTS, 'eins']);
        }
        done();
    });
});
