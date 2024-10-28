import { Document, Named, Query } from 'idai-field-core';
import { useContext, useEffect, useState } from 'react';
import { dropRight, last } from 'tsfun';
import { ConfigurationContext } from '../contexts/configuration-context';
import { DocumentRepository } from '../repositories/document-repository';
import useSearch from './use-search';

interface ProjectData {
  documents: Document[];
  hierarchyPath: Document[];
  pushToHierarchy: (doc: Document) => void;
  popFromHierarchy: () => void;
  isInOverview: (category: string) => boolean;
}

const useProjectData = (
  repository: DocumentRepository,
  q: string
): ProjectData => {
  const config = useContext(ConfigurationContext);

  const [query, setQuery] = useState<Query>({
    categories: config.getOperationCategories().map(Named.toName),
    constraints: {},
  });
  const documents = useSearch(repository, query);
  const [hierarchyPath, setHierarchyPath] = useState<Document[]>([]);

  const pushToHierarchy = (doc: Document) =>
    setHierarchyPath((old) => [...old, doc]);
  const popFromHierarchy = () => setHierarchyPath((old) => dropRight(1, old));
  const isInOverview = (category: string): boolean =>
    config.getOperationCategories().map(Named.toName).includes(category);

  useEffect(() => {
    const operationCategories = config
      .getOperationCategories()
      .map(Named.toName);
    const concreteCategories = config
      .getConcreteFieldCategories()
      .map(Named.toName);

    if (q) {
      setQuery({ q, categories: concreteCategories });
    } else {
      const currentParent = last(hierarchyPath);
      if (currentParent) {
        setQuery({
          constraints: {
            'isChildOf:contain': currentParent.resource.id,
          },
        });
      } else {
        setQuery({ categories: operationCategories });
      }
    }
  }, [config, q, hierarchyPath]);

  return {
    documents,
    hierarchyPath,
    pushToHierarchy,
    popFromHierarchy,
    isInOverview,
  };
};

export default useProjectData;
