import {MDInternal} from '../../../src/app/messages/md-internal';
import {Validator} from '../../../src/app/persist/validator';
import {ProjectConfiguration} from '../../../src/app/configuration/project-configuration';
import {ConfigLoader} from '../../../src/app/configuration/config-loader';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function main() {

    describe('Validator', () => {

        var projectConfiguration = new ProjectConfiguration(
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

        var configLoader = {
            getProjectConfiguration: function() {
                return new Promise<any>(resolve => resolve(projectConfiguration));
            }
        };

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
            new Validator(<ConfigLoader> configLoader)
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

            new Validator(<ConfigLoader> configLoader)
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

            new Validator(<ConfigLoader> configLoader)
                .validate(doc).then(() => fail(), msgWithParams => {
                expect(msgWithParams).toEqual([MDInternal.VALIDATION_ERROR_MISSINGPROPERTY, 'T', 'mandatory']);
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

            new Validator(<ConfigLoader> configLoader)
                .validate(doc).then(() => fail(), msgWithParams => {
                    expect(msgWithParams).toEqual([MDInternal.VALIDATION_ERROR_MISSINGPROPERTY, 'T', 'mandatory']);
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

            new Validator(<ConfigLoader> configLoader)
                .validate(doc).then(() => fail(), msgWithParams => {
                expect(msgWithParams).toEqual([MDInternal.VALIDATION_ERROR_INVALIDFIELD, 'T', 'a']);
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

            new Validator(<ConfigLoader> configLoader)
                .validate(doc).then(() => fail(), msgWithParams => {
                expect(msgWithParams).toEqual([MDInternal.VALIDATION_ERROR_INVALIDFIELDS, 'T', 'a, b']);
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

            new Validator(<ConfigLoader> configLoader).validate(doc).then(
                () => fail(),
                msgWithParams => {
                    expect(msgWithParams).toEqual([MDInternal.VALIDATION_ERROR_INVALIDRELATIONFIELD, 'T2',
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

            new Validator(<ConfigLoader> configLoader).validate(doc).then(
                () => fail(),
                msgWithParams => {
                    expect(msgWithParams).toEqual([MDInternal.VALIDATION_ERROR_INVALIDRELATIONFIELDS, 'T2',
                        'isRelatedTo, isDepictedIn']);
                    done();
                });
        });
    })
}