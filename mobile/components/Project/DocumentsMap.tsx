import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RouteProp } from '@react-navigation/native';
import { Document, RelationsManager, SyncStatus } from 'idai-field-core';
import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import { Alert, Keyboard, StyleSheet, View } from 'react-native';
import useToast from '@/hooks/use-toast';
import { DocumentRepository } from '@/repositories/document-repository';
import { ToastType } from '@/components/common/Toast/ToastProvider';
import DocumentAddModal from './DocumentAddModal';
import DocumentRemoveModal from './DocumentRemoveModal';
import { DocumentsContainerDrawerParamList } from './DocumentsContainer';
import Map from './Map/Map';
import SearchBar from './SearchBar';
import { router } from 'expo-router';
interface DocumentsMapProps {
  // route: RouteProp<DocumentsContainerDrawerParamList, 'DocumentsMap'>;
  // navigation: DrawerNavigationProp<
  //   DocumentsContainerDrawerParamList,
  //   'DocumentsMap'
  // >;
  repository: DocumentRepository;
  documents: Document[];
  syncStatus: SyncStatus;
  relationsManager: RelationsManager;
  issueSearch: (q: string) => void;
  isInOverview: (category: string) => boolean;
  selectParent: (doc: Document) => void;
}

const DocumentsMap: React.FC<DocumentsMapProps> = ({
  repository,
  documents,
  syncStatus,
  relationsManager,
  issueSearch,
  isInOverview,
  selectParent,
}): ReactElement => {
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isDeleteModelOpen, setIsDeleteModelOpen] = useState<boolean>(false);
  const [highlightedDoc, setHighlightedDoc] = useState<Document>();
  const { showToast } = useToast();
  const {navigate} = router;

  const toggleDrawer = useCallback(
    () => toggleDrawer(),
    [
      
    ]
  );

  const onQrCodeScanned = useCallback(
    (data: string) => {
      repository
        .find({ constraints: { 'identifier:match': data } })
        .then(({ documents: [doc] }) =>
          navigate('DocumentEdit', {
            docId: doc.resource.id,
            categoryName: doc.resource.category,
          })
        )
        .catch(() =>
          Alert.alert('Not found', `Resource  '${data}' is not available`, [
            { text: 'OK' },
          ])
        );
    },
    [repository, navigation]
  );

  const handleAddDocument = (parentDoc: Document) => {
    setHighlightedDoc(parentDoc);
    setIsAddModalOpen(true);
  };

  const handleEditDocument = (docId: string, categoryName: string) =>
    navigate('DocumentEdit', { docId, categoryName });

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
          navigate(
            'DocumentsMap',
            isRecordedIn ? { highlightedDocId: isRecordedIn } : {}
          );
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
    if (parentDoc)
      navigate('DocumentAdd', { parentDoc, categoryName });
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
          toggleDrawer,
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
          // highlightedDocId={route.params?.highlightedDocId}
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
