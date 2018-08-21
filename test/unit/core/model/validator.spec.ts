import {ConfigLoader, ProjectConfiguration} from 'idai-components-2';
import {Validator} from '../../../../app/core/model/validator';
import {M} from '../../../../app/m';

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
                        {
                            name: 'id',
                        },
                        {
                            name: 'type',
                        },
                        {
                            name: 'optional',
                        },
                        {
                            name: 'mandatory',
                            mandatory: true
                        },
                        {
                            name: 'number1',
                            label: 'number1',
                            inputType: 'float'
                        },
                        {
                            name: 'number2',
                            label: 'number2',
                            inputType: 'float'
                        }
                    ]
                },
                {
                    type: 'T2',
                    fields: [
                        {
                            name: 'id',
                        },
                        {
                            name: 'type',
                        }
                    ]
                },
            ],
            relations: [
                {
                    name: 'isRelatedTo',
                    domain: ['T'],
                    range: ['T'],
                    inverse: 'NO-INVERSE'
                },
                {
                    name: 'isDepictedIn',
                    domain: ['T'],
                    range: ['T2'],
                    inverse: 'NO-INVERSE'
                }
            ]
        }
    );


    it('should report nothing', done => {

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
        new Validator(projectConfiguration, undefined)
            .validate(doc).then(() => done(), msgWithParams => fail(msgWithParams));
    });


    it('should report nothing when omitting optional property', done => {

        const doc = {
            resource: {
                id: '1',
                type: 'T',
                mandatory: 'm',
                relations: {},
            }
        };

        new Validator(projectConfiguration, undefined)
            .validate(doc).then(() => done(), msgWithParams => fail(msgWithParams));
    });


    it('should report error when omitting mandatory property', done => {

        const doc = {
            resource: {
                id: '1',
                type: 'T',
                relations: {},
            }
        };

        new Validator(projectConfiguration, undefined)
            .validate(doc).then(() => fail(), msgWithParams => {
            expect(msgWithParams).toEqual([M.VALIDATION_ERROR_MISSINGPROPERTY, 'T', 'mandatory']);
            done();
        });
    });


    it('should report error when leaving mandatory property empty', done => {

        const doc = {
            resource: {
                id: '1',
                type: 'T',
                mandatory: '',
                relations: {},
            }
        };

        new Validator(projectConfiguration, undefined)
            .validate(doc).then(() => fail(), msgWithParams => {
                expect(msgWithParams).toEqual([M.VALIDATION_ERROR_MISSINGPROPERTY, 'T', 'mandatory']);
                done();
            });
    });


    it('should report a missing field definition', done => {

        const doc = {
            resource: {
                id: '1',
                type: 'T',
                a: 'b',
                mandatory: 'm',
                relations: {},
            }
        };

        new Validator(projectConfiguration, undefined)
            .validate(doc).then(() => fail(), msgWithParams => {
            expect(msgWithParams).toEqual([M.VALIDATION_ERROR_INVALIDFIELD, 'T', 'a']);
            done();
        });
    });


    it('should report missing field definitions', done => {

        const doc = {
            resource: {
                id: '1',
                type: 'T',
                a: 'b',
                b: 'a',
                mandatory: 'm',
                relations: {},
            }
        };

        new Validator(projectConfiguration, undefined)
            .validate(doc).then(() => fail(), msgWithParams => {
            expect(msgWithParams).toEqual([M.VALIDATION_ERROR_INVALIDFIELDS, 'T', 'a, b']);
            done();
        });
    });


    it('should report a missing relation field definition', done => {

        const doc = {
            resource: {
                id: '1',
                type: 'T2',
                relations: {
                    isRelatedTo: ['2']
                }
            }
        };

        new Validator(projectConfiguration, undefined).validate(doc).then(
            () => fail(),
            msgWithParams => {
                expect(msgWithParams).toEqual([M.VALIDATION_ERROR_INVALIDRELATIONFIELD, 'T2',
                    'isRelatedTo']);
                done();
            });
    });


    it('should report missing relation field definitions', done => {

        const doc = {
            resource: {
                id: '1',
                type: 'T2',
                relations: {
                    isRelatedTo: ['2'],
                    isDepictedIn: ['3']
                }
            }
        };

        new Validator(projectConfiguration, undefined).validate(doc).then(
            () => fail(),
            msgWithParams => {
                expect(msgWithParams).toEqual([M.VALIDATION_ERROR_INVALIDRELATIONFIELDS, 'T2',
                    'isRelatedTo, isDepictedIn']);
                done();
            });
    });


    it('should report invalid numeric field', done => {

        const doc = {
            resource: {
                id: '1',
                type: 'T',
                mandatory: 'm',
                number1: 'ABC',
                relations: {}
            }
        };

        new Validator(projectConfiguration, undefined).validate(doc).then(
            () => fail(),
            msgWithParams => {
                expect(msgWithParams).toEqual([M.VALIDATION_ERROR_INVALID_NUMERIC_VALUE, 'T', 'number1']);
                done();
            });
    });


    it('should report invalid numeric fields', done => {

        const doc = {
            resource: {
                id: '1',
                type: 'T',
                mandatory: 'm',
                number1: 'ABC',
                number2: 'DEF',
                relations: {}
            }
        };

        new Validator(projectConfiguration, undefined).validate(doc).then(
            () => fail(),
            msgWithParams => {
                expect(msgWithParams).toEqual([M.VALIDATION_ERROR_INVALID_NUMERIC_VALUES, 'T',
                    'number1, number2']);
                done();
            });
    });
});
