import {Document} from 'idai-components-2';

export function createMockValidator() {

    return jasmine.createSpyObj('validator', [
        'assertIsRecordedInTargetsExist',
        'assertIsWellformed',
        'assertFieldsDefined',
        'assertLiesWithinCorrectness',
        'assertRelationsWellformedness',
        'assertIsKnownType',
        'assertHasLiesWithin',
        'assertIsAllowedType',
        'assertIsAllowedRelationDomainType',
        'assertSettingIsRecordedInIsPermissibleForType',
        'assertDropdownRangeComplete',
        'assertIsNotOverviewType',
        'isRecordedInTargetAllowedRelationDomainType',
        'assertNoForbiddenRelations']);
}


export function d(id: string, type: string, identifier: string, rels?: any) {

    const document = { resource: { id: id, identifier: identifier, type: type, relations: {} }};
    if (rels) document.resource['relations'] = rels;
    return document as unknown as Document;
}