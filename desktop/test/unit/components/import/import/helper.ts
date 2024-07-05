import { jest } from '@jest/globals';
import { Document } from 'idai-field-core';


export function createMockValidator() {

    return {
        assertIsRecordedInTargetsExist: jest.fn(),
        assertIsWellformed: jest.fn(),
        assertFieldsDefined: jest.fn(),
        assertLiesWithinCorrectness: jest.fn(),
        assertRelationsWellformedness: jest.fn(),
        assertIsKnownCategory: jest.fn(),
        assertHasLiesWithin: jest.fn(),
        assertIsAllowedCategory: jest.fn(),
        assertIsAllowedRelationDomainCategory: jest.fn(),
        assertSettingIsRecordedInIsPermissibleForCategory: jest.fn(),
        assertDropdownRangeComplete: jest.fn(),
        assertIsNotOverviewCategory: jest.fn(),
        isRecordedInTargetAllowedRelationDomainCategory: jest.fn(),
        assertNoForbiddenRelations: jest.fn(),
        assertIdentifierPrefixIsValid: jest.fn(),
        assertResourceLimitNotExceeded: jest.fn(),
        getUndefinedFields: jest.fn()
    };
}


export function d(id: string, category: string, identifier: string, rels?: any) {

    const document = { resource: { id: id, identifier: identifier, category: category, relations: {} } };
    if (rels) document.resource['relations'] = rels;
    return document as unknown as Document;
}
