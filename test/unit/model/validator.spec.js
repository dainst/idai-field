"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("idai-components-2/core");
var validator_1 = require("../../../app/core/model/validator");
var m_1 = require("../../../app/m");
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('Validator', function () {
    var projectConfiguration = new core_1.ProjectConfiguration({
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
    });
    it('should report nothing', function (done) {
        var doc = {
            resource: {
                id: '1',
                type: 'T',
                mandatory: 'm',
                relations: {
                    isRelatedTo: ['2']
                },
            }
        };
        new validator_1.Validator(projectConfiguration)
            .validate(doc).then(function () { return done(); }, function (msgWithParams) { return fail(msgWithParams); });
    });
    it('should report nothing when omitting optional property', function (done) {
        var doc = {
            resource: {
                id: '1',
                type: 'T',
                mandatory: 'm',
                relations: {},
            }
        };
        new validator_1.Validator(projectConfiguration)
            .validate(doc).then(function () { return done(); }, function (msgWithParams) { return fail(msgWithParams); });
    });
    it('should report error when omitting mandatory property', function (done) {
        var doc = {
            resource: {
                id: '1',
                type: 'T',
                relations: {},
            }
        };
        new validator_1.Validator(projectConfiguration)
            .validate(doc).then(function () { return fail(); }, function (msgWithParams) {
            expect(msgWithParams).toEqual([m_1.M.VALIDATION_ERROR_MISSINGPROPERTY, 'T', 'mandatory']);
            done();
        });
    });
    it('should report error when leaving mandatory property empty', function (done) {
        var doc = {
            resource: {
                id: '1',
                type: 'T',
                mandatory: '',
                relations: {},
            }
        };
        new validator_1.Validator(projectConfiguration)
            .validate(doc).then(function () { return fail(); }, function (msgWithParams) {
            expect(msgWithParams).toEqual([m_1.M.VALIDATION_ERROR_MISSINGPROPERTY, 'T', 'mandatory']);
            done();
        });
    });
    it('should report a missing field definition', function (done) {
        var doc = {
            resource: {
                id: '1',
                type: 'T',
                a: 'b',
                mandatory: 'm',
                relations: {},
            }
        };
        new validator_1.Validator(projectConfiguration)
            .validate(doc).then(function () { return fail(); }, function (msgWithParams) {
            expect(msgWithParams).toEqual([m_1.M.VALIDATION_ERROR_INVALIDFIELD, 'T', 'a']);
            done();
        });
    });
    it('should report missing field definitions', function (done) {
        var doc = {
            resource: {
                id: '1',
                type: 'T',
                a: 'b',
                b: 'a',
                mandatory: 'm',
                relations: {},
            }
        };
        new validator_1.Validator(projectConfiguration)
            .validate(doc).then(function () { return fail(); }, function (msgWithParams) {
            expect(msgWithParams).toEqual([m_1.M.VALIDATION_ERROR_INVALIDFIELDS, 'T', 'a, b']);
            done();
        });
    });
    it('should report a missing relation field definition', function (done) {
        var doc = {
            resource: {
                id: '1',
                type: 'T2',
                relations: {
                    isRelatedTo: ['2']
                }
            }
        };
        new validator_1.Validator(projectConfiguration).validate(doc).then(function () { return fail(); }, function (msgWithParams) {
            expect(msgWithParams).toEqual([m_1.M.VALIDATION_ERROR_INVALIDRELATIONFIELD, 'T2',
                'isRelatedTo']);
            done();
        });
    });
    it('should report missing relation field definitions', function (done) {
        var doc = {
            resource: {
                id: '1',
                type: 'T2',
                relations: {
                    isRelatedTo: ['2'],
                    isDepictedIn: ['3']
                }
            }
        };
        new validator_1.Validator(projectConfiguration).validate(doc).then(function () { return fail(); }, function (msgWithParams) {
            expect(msgWithParams).toEqual([m_1.M.VALIDATION_ERROR_INVALIDRELATIONFIELDS, 'T2',
                'isRelatedTo, isDepictedIn']);
            done();
        });
    });
    it('should report invalid numeric field', function (done) {
        var doc = {
            resource: {
                id: '1',
                type: 'T',
                mandatory: 'm',
                number1: 'ABC',
                relations: {}
            }
        };
        new validator_1.Validator(projectConfiguration).validate(doc).then(function () { return fail(); }, function (msgWithParams) {
            expect(msgWithParams).toEqual([m_1.M.VALIDATION_ERROR_INVALID_NUMERIC_VALUE, 'T', 'number1']);
            done();
        });
    });
    it('should report invalid numeric fields', function (done) {
        var doc = {
            resource: {
                id: '1',
                type: 'T',
                mandatory: 'm',
                number1: 'ABC',
                number2: 'DEF',
                relations: {}
            }
        };
        new validator_1.Validator(projectConfiguration).validate(doc).then(function () { return fail(); }, function (msgWithParams) {
            expect(msgWithParams).toEqual([m_1.M.VALIDATION_ERROR_INVALID_NUMERIC_VALUES, 'T',
                'number1, number2']);
            done();
        });
    });
});
//# sourceMappingURL=validator.spec.js.map