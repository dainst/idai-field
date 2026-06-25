import { MaterialIcons } from '@expo/vector-icons';
import {
  CategoryForm,
  Document,
  NewDocument,
  NewResource,
} from 'idai-field-core';
import React, { useCallback, useContext, useEffect, useState } from 'react';
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
import KoreanFieldworkDraftContinuationPanel from '@/components/Project/KoreanFieldworkDraftContinuationPanel';
import KoreanFieldworkDraftContextPanel from '@/components/Project/KoreanFieldworkDraftContextPanel';
import KoreanFieldworkDraftPresetPanel from '@/components/Project/KoreanFieldworkDraftPresetPanel';
import KoreanFieldworkNarrativeAssistPanel from '@/components/Project/KoreanFieldworkNarrativeAssistPanel';
import KoreanFieldworkQuickRecordPanel from '@/components/Project/KoreanFieldworkQuickRecordPanel';
import KoreanFieldworkSoilColorPanel from '@/components/Project/KoreanFieldworkSoilColorPanel';
import {
  getKoreanFieldworkReturnParam,
  getKoreanFieldworkReturnTarget,
  navigateToKoreanFieldworkReturnTarget,
} from '@/components/Project/korean-fieldwork-navigation';
import {
  KoreanFieldworkDraftContinuationTarget,
  MAP_CONTINUATION_TARGET,
} from '@/components/Project/korean-fieldwork-draft-continuation';
import {
  createKoreanFieldworkDraftRelations,
  createKoreanFieldworkDraftResource,
} from '@/components/Project/korean-fieldwork-document-drafts';
import { ToastType } from '@/components/common/Toast/ToastProvider';
import { router, useGlobalSearchParams } from 'expo-router';
import { ProjectContext } from '@/contexts/project-context';
import { PreferencesContext } from '@/contexts/preferences-context';
import {
  KoreanFieldworkInvestigationModeId,
  loadKoreanFieldworkInvestigationModeId,
} from '@/components/Project/korean-fieldwork-investigation-mode';

const DocumentAdd: React.FC = () => {
  const config = useContext(ConfigurationContext);
  const { labels } = useContext(LabelsContext);
  const { repository } = useContext(ProjectContext);
  const preferencesContext = useContext(PreferencesContext);
  const params = useGlobalSearchParams();
  const parentDocId = getParam(params.parentDocId);
  const categoryName = getParam(params.categoryName);
  const featureType = getParam(params.featureType);
  const returnTarget = getKoreanFieldworkReturnTarget(params.returnTo);
  const parentDoc = useDocument(repository, parentDocId);

  const { showToast } = useToast();
  const [category, setCategory] = useState<CategoryForm>();
  const [newResource, setNewResource] = useState<NewResource>();
  const [saveBtnEnabled, setSaveBtnEnabled] = useState<boolean>(false);
  const [investigationModeId, setInvestigationModeId] =
    useState<KoreanFieldworkInvestigationModeId>();
  const projectId = preferencesContext.preferences.currentProject;

  const setResourceToDefault = useCallback(
    () => {
      if (!categoryName || !parentDoc) {
        setNewResource(undefined);
        return;
      }

      setNewResource(
        createKoreanFieldworkDraftResource(parentDoc, categoryName, config, {
          featureType,
        })
      );
    },
    [parentDoc, categoryName, config, featureType]
  );

  useEffect(() => setResourceToDefault(), [setResourceToDefault, category]);

  useEffect(() => {
    if (newResource?.identifier) setSaveBtnEnabled(true);
    else setSaveBtnEnabled(false);
  }, [newResource]);

  useEffect(
    () => {
      if (categoryName) setCategory(config.getCategory(categoryName));
    },
    [config, categoryName]
  );

  useEffect(() => {
    let isActive = true;
    setInvestigationModeId(undefined);

    loadKoreanFieldworkInvestigationModeId(projectId)
      .then((modeId) => {
        if (isActive && modeId) setInvestigationModeId(modeId);
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [projectId]);

  const updateResource = (key: string, value: unknown) =>
    setNewResource(
      (oldResource) => oldResource && { ...oldResource, [key]: value }
    );

  const applyResourceUpdates = (updates: Record<string, unknown>) =>
    setNewResource(
      (oldResource) => oldResource && { ...oldResource, ...updates }
    );

  const updateSoilProfileCapture = (data: SoilProfileCaptureData) => {
    setNewResource((oldResource) => oldResource && { ...oldResource, ...data });
  };
  const updatePhotoCapture = (data: FieldworkPhotoCaptureData) => {
    setNewResource((oldResource) => oldResource && { ...oldResource, ...data });
  };

  const saveButtonHandler = (
    target: KoreanFieldworkDraftContinuationTarget = MAP_CONTINUATION_TARGET
  ) => {
    if (newResource) {
      const newDocument: NewDocument = {
        resource: newResource,
      };
      repository
        ?.create(newDocument)
        .then((doc) => {
          showToast(ToastType.Success, `${doc.resource.identifier} 기록을 만들었습니다.`);
          continueAfterSave(target, doc);
        })
        .catch((_err) => {
          Keyboard.dismiss();
          showToast(ToastType.Error, '기록을 만들지 못했습니다.');
          console.log(_err);
        });
    }
  };

  const continueAfterSave = (
    target: KoreanFieldworkDraftContinuationTarget,
    doc: Document
  ) => {
    if (target.mode === 'same') {
      setResourceToDefault();
      return;
    }

    if (target.mode === 'edit') {
      router.navigate({
        pathname: '/ProjectScreen/DocumentEdit',
        params: {
          docId: doc.resource.id,
          categoryName: doc.resource.category,
          ...getKoreanFieldworkReturnParam(returnTarget),
        },
      });
      return;
    }

    if (target.mode === 'addChild' && target.categoryName) {
      router.navigate({
        pathname: '/ProjectScreen/DocumentAdd',
        params: {
          parentDocId: doc.resource.id,
          categoryName: target.categoryName,
          ...getKoreanFieldworkReturnParam(returnTarget),
        },
      });
      return;
    }

    setResourceToDefault();
    navigateToKoreanFieldworkReturnTarget(returnTarget, doc.resource.id);
  };

  const onReturn = () => {
    setResourceToDefault();
    navigateToKoreanFieldworkReturnTarget(returnTarget, parentDocId);
  };

  if (!categoryName || !parentDoc || !category || !labels || !newResource) {
    return (
      <DocumentAddLoadingState
        missingItems={getMissingDependencies([
          [!repository, '저장소'],
          [!categoryName, '기록 종류'],
          [!parentDoc, '포함 위치'],
          [!category, '양식'],
          [!labels, '라벨'],
          [!newResource, '입력값'],
        ])}
      />
    );
  }

  return (
    <DocumentForm
      titleBarRight={
        <Button
          variant="success"
          onPress={() => saveButtonHandler()}
          title="저장"
          isDisabled={!saveBtnEnabled}
          icon={
            <MaterialIcons
              name="save"
              size={18}
              color="white"
              testID="saveDocBtn"
            />
          }
        />
      }
      category={category}
      collapseFormFieldsByDefault={true}
      headerText={`${labels.get(category)} 만들기`}
      returnBtnHandler={onReturn}
      formHeader={
        <View>
          <KoreanFieldworkDraftContextPanel
            parentDocument={parentDoc}
            resource={newResource}
          />
          <KoreanFieldworkDraftPresetPanel
            category={category}
            resource={newResource}
            onApplyPreset={applyResourceUpdates}
          />
          <KoreanFieldworkQuickRecordPanel
            category={category}
            investigationModeId={investigationModeId}
            resource={newResource}
            onUpdateResourceField={updateResource}
            onUpdateResourceFields={applyResourceUpdates}
          />
          <KoreanFieldworkNarrativeAssistPanel
            category={category}
            resource={newResource}
            onUpdateResourceField={updateResource}
          />
          <KoreanFieldworkSoilColorPanel
            category={category}
            resource={newResource}
            onUpdateResourceField={updateResource}
            onUpdateResourceFields={applyResourceUpdates}
          />
          <KoreanFieldworkDraftContinuationPanel
            categoryName={categoryName}
            config={config}
            onSaveWithTarget={saveButtonHandler}
          />
        </View>
      }
      resource={newResource}
      updateFunction={updateResource}
      resourceActions={renderPhotoResourceActions(
        categoryName,
        newResource,
        updatePhotoCapture,
        updateSoilProfileCapture
      )}
    />
  );
};

export const createRelations = createKoreanFieldworkDraftRelations;

export default DocumentAdd;

const getParam = (param: string | string[] | undefined): string | undefined =>
  Array.isArray(param) ? param[0] : param;

const renderPhotoResourceActions = (
  categoryName: string,
  resource: NewResource,
  updatePhotoCapture: (data: FieldworkPhotoCaptureData) => void,
  updateSoilProfileCapture: (data: SoilProfileCaptureData) => void
) => {
  if (categoryName === 'Photo') {
    return (
      <PhotoCameraButton
        capturedUri={getStringValue(resource.imageUri ?? resource.fieldworkPhotoUri)}
        onCapture={updatePhotoCapture}
      />
    );
  }

  if (categoryName === 'SoilProfilePhoto') {
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

const DocumentAddLoadingState: React.FC<{ missingItems: string }> = ({
  missingItems,
}) => (
  <View style={styles.loadingContainer}>
    <Text style={styles.loadingText}>
      {`기록 추가 화면을 준비하고 있습니다.\n남은 항목: ${missingItems}`}
    </Text>
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
