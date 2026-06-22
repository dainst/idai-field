import {
  CategoryForm,
  Document,
  ProjectConfiguration,
  Tree,
} from 'idai-field-core';

export const getKoreanFieldworkAllowedChildCategoryNames = (
  parentDoc: Document,
  config: ProjectConfiguration
): string[] => Tree.flatten(config.getCategories())
  .filter((candidateCategory) =>
    canCreateKoreanFieldworkChildRecord(candidateCategory, parentDoc, config)
  )
  .map((candidateCategory) => candidateCategory.name);

export const canCreateKoreanFieldworkChildRecord = (
  category: CategoryForm,
  parentDoc: Document,
  config: ProjectConfiguration
): boolean => {
  if (category.name === 'Image') return false;

  const canUseRelation = (relationName: string) =>
    config.isAllowedRelationDomainCategory(
      category.name,
      parentDoc.resource.category,
      relationName
    );

  return (
    (canUseRelation('isRecordedIn') && !category.mustLieWithin)
    || canUseRelation('liesWithin')
    || canUseRelation('depicts')
    || canUseRelation('isMapLayerOf')
  );
};
