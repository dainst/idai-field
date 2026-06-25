import { useEffect, useState } from 'react';
import {
  KoreanFieldworkInvestigationModeId,
  loadKoreanFieldworkProjectSetupDefaults,
} from '@/components/Project/korean-fieldwork-investigation-mode';
import {
  syncKoreanFieldworkProjectSetupDefaultsToProjectDocument,
} from '@/components/Project/korean-fieldwork-project-setup-sync';
import { DocumentRepository } from '@/repositories/document-repository';

export interface KoreanFieldworkProjectSetupDefaultsState {
  boundarySummary?: string;
  investigationModeId?: KoreanFieldworkInvestigationModeId;
}

export const useKoreanFieldworkProjectSetupDefaults = (
  projectId: string,
  repository: DocumentRepository | undefined
): KoreanFieldworkProjectSetupDefaultsState => {
  const [setupDefaults, setSetupDefaults] =
    useState<KoreanFieldworkProjectSetupDefaultsState>({});

  useEffect(() => {
    let isActive = true;
    setSetupDefaults({});

    const loadProjectSetupDefaults = async () => {
      if (!projectId) return;

      const projectDocument = repository
        ? await repository.get('project').catch(() => undefined)
        : undefined;
      const loadedSetupDefaults =
        await loadKoreanFieldworkProjectSetupDefaults(
          projectId,
          projectDocument
        );

      if (isActive) {
        setSetupDefaults({
          boundarySummary: loadedSetupDefaults.boundarySummary,
          investigationModeId: loadedSetupDefaults.investigationModeId,
        });
      }

      await syncKoreanFieldworkProjectSetupDefaultsToProjectDocument(
        repository,
        loadedSetupDefaults,
        projectDocument
      ).catch(() => undefined);
    };

    loadProjectSetupDefaults().catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [projectId, repository]);

  return setupDefaults;
};

export default useKoreanFieldworkProjectSetupDefaults;
