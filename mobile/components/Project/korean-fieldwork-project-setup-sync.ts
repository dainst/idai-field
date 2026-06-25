import { Document } from 'idai-field-core';
import { DocumentRepository } from '@/repositories/document-repository';
import {
  createKoreanFieldworkProjectSetupResourceUpdates,
  KoreanFieldworkProjectSetupDefaults,
} from './korean-fieldwork-investigation-mode';

export const syncKoreanFieldworkProjectSetupDefaultsToProjectDocument = async (
  repository: DocumentRepository | undefined,
  setupDefaults: KoreanFieldworkProjectSetupDefaults,
  projectDocument?: Document
): Promise<Document | undefined> => {
  if (!repository) return undefined;

  const documentToUpdate = projectDocument
    ?? await repository.get('project').catch(() => undefined);
  if (!documentToUpdate) return undefined;

  const updates =
    createKoreanFieldworkProjectSetupResourceUpdates(setupDefaults);
  const hasChanges = Object.entries(updates).some(([fieldName, value]) =>
    (documentToUpdate.resource as Record<string, unknown>)[fieldName] !== value
  );

  if (!hasChanges) return documentToUpdate;

  return repository.update({
    ...documentToUpdate,
    resource: {
      ...documentToUpdate.resource,
      ...updates,
    },
  });
};
