import {
  Document,
  Named,
  ProjectConfiguration,
  Query,
} from 'idai-field-core';
import { useContext, useEffect, useState } from 'react';
import { dropRight, last } from 'tsfun';
import {
  KOREAN_FIELDWORK_CATEGORY_ORDER,
} from '@/components/Project/korean-fieldwork-categories';
import { ConfigurationContext } from '@/contexts/configuration-context';
import { DocumentRepository } from '@/repositories/document-repository';
import useSearch from './use-search';

interface ProjectData {
  documents: Document[];
  hierarchyPath: Document[];
  pushToHierarchy: (doc: Document) => void;
  popFromHierarchy: () => void;
  clearHierarchy: () => void;
  isInOverview: (category: string) => boolean;
}

const useProjectData = (
  repository: DocumentRepository,
  q: string
): ProjectData => {
  const config = useContext(ConfigurationContext);

  const [query, setQuery] = useState<Query>({
    categories: getOverviewCategoryNames(config),
    constraints: {},
  });
  const documents = useSearch(repository, query);
  const [hierarchyPath, setHierarchyPath] = useState<Document[]>([]);

  const pushToHierarchy = (doc: Document) =>
    setHierarchyPath((old) => [...old, doc]);
  const popFromHierarchy = () => setHierarchyPath((old) => dropRight(1, old));
  const clearHierarchy = () => setHierarchyPath([]);
  const isInOverview = (category: string): boolean =>
    getOverviewCategoryNames(config).includes(category);

  useEffect(() => {
    const overviewCategories = getOverviewCategoryNames(config);

    if (q) {
      setQuery({ q, categories: overviewCategories });
    } else {
      const currentParent = last(hierarchyPath);
      if (currentParent) {
        setQuery({
          constraints: {
            'isChildOf:contain': currentParent.resource.id,
          },
        });
      } else {
        setQuery({ categories: overviewCategories });
      }
    }
  }, [config, q, hierarchyPath]);

  return {
    documents,
    hierarchyPath,
    pushToHierarchy,
    popFromHierarchy,
    clearHierarchy,
    isInOverview,
  };
};

export default useProjectData;

const getOverviewCategoryNames = (
  config: ProjectConfiguration
): string[] => {
  const koreanFieldworkCategories = KOREAN_FIELDWORK_CATEGORY_ORDER.filter(
    (categoryName) => !!config.getCategory(categoryName)
  );

  if (koreanFieldworkCategories.length > 0) return koreanFieldworkCategories;

  const concreteOverviewCategories = config
    .getConcreteOverviewCategories()
    .map(Named.toName);

  return concreteOverviewCategories.length > 0
    ? concreteOverviewCategories
    : config.getOperationCategories().map(Named.toName);
};
