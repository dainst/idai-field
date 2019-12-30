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