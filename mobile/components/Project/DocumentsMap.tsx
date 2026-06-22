import {
  Document,
  getKoreanFieldworkTodaySummary,
  RelationsManager,
  SyncStatus,
} from 'idai-field-core';
import React, {
  ReactElement,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Alert, Keyboard, StyleSheet, View } from 'react-native';
import useToast from '@/hooks/use-toast';
import { DocumentRepository } from '@/repositories/document-repository';
import { ToastType } from '@/components/common/Toast/ToastProvider';
import DocumentAddModal from './DocumentAddModal';
import DocumentRemoveModal from './DocumentRemoveModal';
import KoreanFieldworkTodayBoard from './KoreanFieldworkTodayBoard';

import Map from './Map/Map';
import { router, useGlobalSearchParams } from 'expo-router';
import SearchBar from './SearchBar';
import { ProjectContext } from '@/contexts/project-context';
interface DocumentsMapProps {
  repository: DocumentRepository;
  syncStatus: SyncStatus;
  relationsManager?: RelationsManager;
  issueSearch: (q: string) => void;
  selectParent: (doc: Document) => void;
}

const DocumentsMap: React.FC<DocumentsMapProps> = ({
  repository,
  syncStatus,
  relationsManager,
  issueSearch,
  selectParent,
}): ReactElement => {
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isDeleteModelOpen, setIsDeleteModelOpen] = useState<boolean>(false);
  const [highlightedDoc, setHighlightedDoc] = useState<Document>();
  // TODO: configure expo router to load params
  const params = useGlobalSearchParams();

  const { showToast } = useToast();
  const { documents, onDocumentSelected } = useContext(ProjectContext);
  const todaySummary = useMemo(
    () => getKoreanFieldworkTodaySummary(documents),
    [documents]
  );
  const selectedDocumentIds = useMemo(
    () => documents.map((doc) => doc.resource.id),
    [documents]
  );
  const highlightedDocId = getStringParam(params?.highlightedDocId);

  const onQrCodeScanned = useCallback(
    (data: string) => {
      repository
        ?.find({ constraints: { 'identifier:match': data } })
        .then(({ documents: [doc] }) => {
          router.navigate({
            pathname: '/ProjectScreen/DocumentEdit',
            params: {
              docId: doc.resource.id,
              categoryName: doc.resource.category,
            },
          });
        })
        .catch(() =>
          Alert.alert('Not found', `Resource  '${data}' is not available`, [
            { text: 'OK' },
          ])
        );
    },
    [repository]
  );

  const handleAddDocument = (parentDoc: Document) => {
    setHighlightedDoc(parentDoc);
    setIsAddModalOpen(true);
  };

  const handleAddDocumentOfCategory = (
    parentDoc: Document,
    categoryName: string
  ) => {
    router.navigate({
      pathname: '/ProjectScreen/DocumentAdd',
      params: {
        parentDocId: parentDoc.resource.id,
        categoryName,
      },
    });
  };

  const handleEditDocument = (docId: string, categoryName: string) => {
    router.navigate({
      pathname: '/ProjectScreen/DocumentEdit',
      params: { docId, categoryName },
    });
  };

  const closeAddModal = () => setIsAddModalOpen(false);

  const openRemoveDocument = (doc: Document) => {
    if (!relationsManager) {
      showToast(
        ToastType.Error,
        '관계 색인을 준비하는 중입니다. 잠시 후 다시 삭제해 주세요.'
      );
      return;
    }

    setHighlightedDoc(doc);
    setIsDeleteModelOpen(true);
  };

  const closeDeleteModal = () => setIsDeleteModelOpen(false);

  const onRemoveDocument = (doc: Document | undefined) => {
    if (!relationsManager) {
      showToast(
        ToastType.Error,
        '관계 색인을 준비하는 중입니다. 잠시 후 다시 삭제해 주세요.'
      );
      return;
    }

    if (doc) {
      const isRecordedIn = doc.resource.relations.isRecordedIn
        ? doc.resource.relations.isRecordedIn[0]
        : '';
      const identifier = doc.resource.identifier;

      relationsManager
        .remove(doc, { descendants: true })
        .then(() => {
          setIsDeleteModelOpen(false);
          showToast(ToastType.Info, `Removed ${identifier}`);
          router.navigate({
            pathname: '/ProjectScreen/DocumentsMap',
            params: isRecordedIn ? { highlightedDocId: isRecordedIn } : {},
          });
        })
        .catch((err) => {
          showToast(ToastType.Error, `Could not remove ${identifier}: ${err}`);
          Keyboard.dismiss();
        });
    }
  };

  const navigateAddCategory = (
    categoryName: string,
    parentDoc: Document | undefined
  ) => {
    closeAddModal();
    if (parentDoc) {
      router.navigate({
        pathname: '/ProjectScreen/DocumentAdd',
        params: {
          parentDocId: parentDoc.resource.id,
          categoryName,
        },
      });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {isAddModalOpen && (
        <DocumentAddModal
          onClose={closeAddModal}
          parentDoc={highlightedDoc}
          onAddCategory={navigateAddCategory}
        />
      )}
      {isDeleteModelOpen && (
        <DocumentRemoveModal
          onClose={closeDeleteModal}
          onRemoveDocument={onRemoveDocument}
          doc={highlightedDoc}
        />
      )}
      <SearchBar
        {...{
          issueSearch,
          syncStatus,
          onQrCodeScanned,
        }}
      />
      <KoreanFieldworkTodayBoard
        summary={todaySummary}
        documents={documents}
        onEditDocument={handleEditDocument}
        onOpenDocument={onDocumentSelected}
      />
      <View style={styles.container}>
        <Map
          repository={repository}
          documents={documents}
          selectedDocumentIds={selectedDocumentIds}
          highlightedDocId={highlightedDocId}
          addDocument={handleAddDocument}
          addDocumentOfCategory={handleAddDocumentOfCategory}
          editDocument={handleEditDocument}
          removeDocument={openRemoveDocument}
          selectParent={selectParent}
          readinessIssues={todaySummary.openIssues}
        />
      </View>
    </View>
  );
};

const getStringParam = (
  param: string | string[] | undefined
): string | undefined => Array.isArray(param) ? param[0] : param;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default DocumentsMap;
