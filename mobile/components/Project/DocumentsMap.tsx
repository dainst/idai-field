import { Document, RelationsManager, SyncStatus } from 'idai-field-core';
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

import Map from './Map/Map';
import { router, useGlobalSearchParams } from 'expo-router';
import SearchBar from './SearchBar';
import { ProjectContext } from '@/contexts/project-context';
interface DocumentsMapProps {
  repository: DocumentRepository;
  syncStatus: SyncStatus;
  relationsManager: RelationsManager;
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
  const { documents, isInOverview } = useContext(ProjectContext);

  const onQrCodeScanned = useCallback(
    (data: string) => {
      repository
        ?.find({ constraints: { 'identifier:match': data } })
        .then(({ documents: [doc] }) => {
          router.setParams({
            docId: doc.resource.id,
            categoryName: doc.resource.category,
          });
          router.navigate('/ProjectScreen/DocumentEdit');
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

  const handleEditDocument = (docId: string, categoryName: string) => {
    router.setParams({ docId, categoryName });
    router.navigate('/ProjectScreen/DocumentEdit');
  };

  const closeAddModal = () => setIsAddModalOpen(false);

  const openRemoveDocument = (doc: Document) => {
    setHighlightedDoc(doc);
    setIsDeleteModelOpen(true);
  };

  const closeDeleteModal = () => setIsDeleteModelOpen(false);

  const onRemoveDocument = (doc: Document | undefined) => {
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
          router.setParams(
            isRecordedIn ? { highlightedDocId: isRecordedIn } : {}
          );
          router.navigate('/ProjectScreen/DocumentsMap');
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
      router.setParams({ parentDocId: parentDoc?._id, categoryName });
      router.navigate('/ProjectScreen/DocumentAdd');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {isAddModalOpen && (
        <DocumentAddModal
          onClose={closeAddModal}
          parentDoc={highlightedDoc}
          onAddCategory={navigateAddCategory}
          isInOverview={isInOverview}
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
      <View style={styles.container}>
        <Map
          repository={repository}
          selectedDocumentIds={useMemo(
            () => documents.map((doc) => doc.resource.id),
            [documents]
          )}
          highlightedDocId={params?.highlightedDocId}
          addDocument={handleAddDocument}
          editDocument={handleEditDocument}
          removeDocument={openRemoveDocument}
          selectParent={selectParent}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default DocumentsMap;
