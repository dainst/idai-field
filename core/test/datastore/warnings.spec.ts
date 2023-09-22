import { Warnings } from '../../src/datastore/warnings';
import { Field } from '../../src/model/configuration/field';
import { doc } from '../test-helpers';


const createDocument = (id: string, category: string = 'category') =>
    doc('sd', 'identifier' + id, category, id);


/**
 * @author Thomas Kleinke
 */
describe('Warnings', () => {

    it('create field warnings', () => {

        const categoryDefinition = {
            name: 'category',
            groups: [
                {
                    fields: [
                        {
                            name: 'shortDescription',
                            inputType: Field.InputType.INPUT
                        },
                        {
                            name: 'number',
                            inputType: Field.InputType.FLOAT
                        },
                        {
                            name: 'dropdown',
                            inputType: Field.InputType.DROPDOWN,
                            valuelist: {
                                values: { 'value': {} }
                            }
                        }
                    ]
                }
            ]
        } as any;

        const documents = [
            createDocument('1'),
            createDocument('2')
        ];
        documents[0].resource.identifier = '1';
        documents[0].resource.number = 'text';
        documents[0].resource.dropdown = 'invalidValue';
        documents[0].resource.unconfiguredField = 'text';

        documents[1].resource.identifier = '2';
        documents[1].resource.number = 1;
        documents[1].resource.dropdown = 'value';

        expect(Warnings.getWarnings(documents[0], categoryDefinition)).toEqual({
            unconfigured: ['unconfiguredField'],
            invalid: ['number'],
            outlierValues: ['dropdown'] 
        });
        expect(Warnings.getWarnings(documents[1], categoryDefinition)).toBeUndefined();
    });
});
