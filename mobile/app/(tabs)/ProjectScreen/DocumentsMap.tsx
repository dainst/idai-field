import React, { useContext } from 'react';

import DocumentsMap from '@/components/Project/DocumentsMap';
import { ProjectContext } from '@/contexts/project-context';

const DocumentMapContainer: React.FC = () => {
  const { repository, relationsManager, syncStatus, setQ, onParentSelected } =
    useContext(ProjectContext);

  if (repository && relationsManager && syncStatus)
    return (
      <DocumentsMap
        repository={repository}
        issueSearch={setQ}
        syncStatus={syncStatus}
        relationsManager={relationsManager}
        selectParent={onParentSelected}
      />
    );
};

export default DocumentMapContainer;
