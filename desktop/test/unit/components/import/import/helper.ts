import { Document } from 'idai-field-core';


export function createMockValidator() {

    return jasmine.createSpyObj('validator', [
        'assertIsRecordedInTargetsExist',
        'assertIsWellformed',
        'assertFieldsDefined',
        'assertLiesWithinCorrectness',
        'assertRelationsWellformedness',
        'assertIsKnownCategory',
        'assertHasLiesWithin',
        'assertIsAllowedCategory',
        'assertIsAllowedRelationDomainCategory',
        'assertSettingIsRecordedInIsPermissibleForCategory',
        'assertDropdownRangeComplete',
        'assertIsNotOverviewCategory',
        'isRecordedInTargetAllowedRelationDomainCategory',
        'assertNoForbiddenRelations',
        'assertIdentifierPrefixIsValid',
        'assertResourceLimitNotExceeded',
        'getUndefinedFields'
    ]);
}


export function d(id: string, category: string, identifier: string, rels?: any) {

    const document = { resource: { id: id, identifier: identifier, category: category, relations: {} } };
    if (rels) document.resource['relations'] = rels;
    return document as unknown as Document;
}
