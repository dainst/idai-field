import { Ionicons } from '@expo/vector-icons';
import {
  CategoryForm,
  Document,
  Resource,
} from 'idai-field-core';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { ConfigurationContext } from '@/contexts/configuration-context';
import LabelsContext from '@/contexts/labels/labels-context';
import useDocument from '@/hooks/use-document';
import useToast from '@/hooks/use-toast';

import Button from '@/components/common/Button';
import DocumentForm from '@/components/common/forms/DocumentForm';
import SoilProfileCameraButton, {
  FieldworkPhotoCaptureData,
  PhotoCameraButton,
  SoilProfileCaptureData,
} from '@/components/Project/SoilProfileCameraButton';
import KoreanFieldworkRecordActionPanel from '@/components/Project/KoreanFieldworkRecordActionPanel';
import KoreanFieldworkRecordContextPanel from '@/components/Project/KoreanFieldworkRecordContextPanel';
import KoreanFieldworkNarrativeAssistPanel from '@/components/Project/KoreanFieldworkNarrativeAssistPanel';
import KoreanFieldworkQuickRecordPanel from '@/components/Project/KoreanFieldworkQuickRecordPanel';
import { ToastType } from '@/components/common/Toast/ToastProvider';
import { router, useGlobalSearchParams } from 'expo-router';
import { ProjectContext } from '@/contexts/project-context';
import { getKoreanFieldworkAllowedChildCategoryNames } from '@/components/Project/korean-fieldwork-child-records';

const DocumentEdit: React.FC = () => {
  const { showToast } = useToast();
  const { documents, repository } = useContext(ProjectContext);

  // TODO: configure expo router to load params
  const params = useGlobalSearchParams();
  const docId = getParam(params.docId);
  const categoryName = getParam(params.categoryName);

  const config = useContext(ConfigurationContext);
  const { labels } = useContext(LabelsContext);

  const document = useDocument(repository, docId);
  const [category, setCategory] = useState<CategoryForm>();
  const [resource, setResource] = useState<Resource>();

  useEffect(() => {
    const formName = categoryName ?? document?.resource.category;
    if (formName) setCategory(config.getCategory(formName));
  }, [categoryName, config, document]);

  useEffect(() => {
    if (document) setResource(document.resource);
  }, [document]);

  const onReturn = () => {
    router.navigate('/ProjectScreen/DocumentsMap');
  };

  const editDocument = () => {
    if (document && resource) {
      repository
        ?.update({ ...document, resource })
        .then((doc) => {
          showToast(ToastType.Success, `${doc.resource.identifier} 기록을 저장했습니다.`);
          router.navigate({
            pathname: '/ProjectScreen/DocumentsMap',
            params: {
              highlightedDocId: doc.resource.id,
            },
          });
        })
        .catch((err) => {
          Keyboard.dismiss();
          showToast(
            ToastType.Error,
            `${document.resource.identifier} 기록을 저장하지 못했습니다: ${err}`
          );
        });
    }
  };

  const updateResource = (key: string, value: unknown) => {
    setResource(
      (oldResource) => oldResource && { ...oldResource, [key]: value }
    );
  };
  const applyResourceUpdates = (updates: Record<string, unknown>) => {
    setResource(
      (oldResource) => oldResource && { ...oldResource, ...updates }
    );
  };

  const updateSoilProfileCapture = (data: SoilProfileCaptureData) => {
    setResource((oldResource) => oldResource && { ...oldResource, ...data });
  };
  const updatePhotoCapture = (data: FieldworkPhotoCaptureData) => {
    setResource((oldResource) => oldResource && { ...oldResource, ...data });
  };
  const allowedAddCategoryNames = useMemo(
    () => document
      ? getKoreanFieldworkAllowedChildCategoryNames(document, config)
      : [],
    [config, document]
  );
  const openRelatedDocument = (relatedDocument: Document) => {
    router.navigate({
      pathname: '/ProjectScreen/DocumentEdit',
      params: {
        docId: relatedDocument.resource.id,
        categoryName: relatedDocument.resource.category,
      },
    });
  };
  const addRelatedDocument = (parentDoc: Document, childCategoryName: string) => {
    router.navigate({
      pathname: '/ProjectScreen/DocumentAdd',
      params: {
        parentDocId: parentDoc.resource.id,
        categoryName: childCategoryName,
      },
    });
  };

  if (!docId) {
    return <DocumentEditLoadingState text="편집할 기록 정보를 찾는 중입니다." />;
  }

  if (!category || !labels || !document || !resource) {
    return (
      <DocumentEditLoadingState
        text={`기록 편집 화면을 준비하고 있습니다.\n남은 항목: ${getMissingDependencies([
          [!repository, '저장소'],
          [!document, '기록'],
          [!category, '양식'],
          [!labels, '라벨'],
          [!resource, '입력값'],
        ])}`}
      />
    );
  }

  const effectiveDocument = { ...document, resource };

  return (
    <DocumentForm
      titleBarRight={
        <Button
          variant="primary"
          onPress={editDocument}
          title="저장"
          icon={
            <Ionicons name="create-outline" size={18} testID="editDocBtn" />
          }
        />
      }
      category={category}
      headerText={`${labels.get(category)} 편집: ${
        document.resource.identifier
      }`}
      returnBtnHandler={onReturn}
      formHeader={
        <View>
          <KoreanFieldworkRecordContextPanel
            document={effectiveDocument}
            documents={documents ?? []}
            allowedAddCategoryNames={allowedAddCategoryNames}
            onAddDocumentOfCategory={addRelatedDocument}
            onOpenDocument={openRelatedDocument}
            onUpdateResourceFields={applyResourceUpdates}
          />
          <KoreanFieldworkRecordActionPanel
            document={effectiveDocument}
            documents={documents ?? []}
            allowedAddCategoryNames={allowedAddCategoryNames}
            onAddDocumentOfCategory={addRelatedDocument}
            onOpenDocument={openRelatedDocument}
          />
          <KoreanFieldworkNarrativeAssistPanel
            category={category}
            resource={resource}
            onUpdateResourceField={updateResource}
          />
          <KoreanFieldworkQuickRecordPanel
            category={category}
            resource={resource}
            onUpdateResourceField={updateResource}
            onUpdateResourceFields={applyResourceUpdates}
          />
        </View>
      }
      resource={resource}
      updateFunction={updateResource}
      resourceActions={renderPhotoResourceActions(
        resource,
        updatePhotoCapture,
        updateSoilProfileCapture
      )}
    />
  );
};

const getParam = (param: string | string[] | undefined): string | undefined =>
  Array.isArray(param) ? param[0] : param;

const renderPhotoResourceActions = (
  resource: Resource,
  updatePhotoCapture: (data: FieldworkPhotoCaptureData) => void,
  updateSoilProfileCapture: (data: SoilProfileCaptureData) => void
) => {
  if (resource.category === 'Photo') {
    return (
      <PhotoCameraButton
        capturedUri={getStringValue(resource.imageUri ?? resource.fieldworkPhotoUri)}
        onCapture={updatePhotoCapture}
      />
    );
  }

  if (resource.category === 'SoilProfilePhoto') {
    return (
      <SoilProfileCameraButton
        capturedUri={getStringValue(resource.soilProfilePhotoUri)}
        onCapture={updateSoilProfileCapture}
      />
    );
  }

  return undefined;
};

const getStringValue = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0
    ? value
    : undefined;

const getMissingDependencies = (
  dependencies: [boolean, string][]
): string =>
  dependencies
    .filter(([isMissing]) => isMissing)
    .map(([, label]) => label)
    .join(', ');

const DocumentEditLoadingState: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.loadingContainer}>
    <Text style={styles.loadingText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#526272',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default DocumentEdit;
