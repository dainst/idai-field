import { Ionicons } from '@expo/vector-icons';
import { CategoryForm, Resource } from 'idai-field-core';
import React, { useContext, useEffect, useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { ConfigurationContext } from '@/contexts/configuration-context';
import LabelsContext from '@/contexts/labels/labels-context';
import useDocument from '@/hooks/use-document';
import useToast from '@/hooks/use-toast';

import Button from '@/components/common/Button';
import DocumentForm from '@/components/common/forms/DocumentForm';
import SoilProfileCameraButton, {
  SoilProfileCaptureData,
} from '@/components/Project/SoilProfileCameraButton';
import { ToastType } from '@/components/common/Toast/ToastProvider';
import { router, useGlobalSearchParams } from 'expo-router';
import { ProjectContext } from '@/contexts/project-context';

const DocumentEdit: React.FC = () => {
  const { showToast } = useToast();
  const { repository } = useContext(ProjectContext);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateResource = (key: string, value: any) => {
    setResource(
      (oldResource) => oldResource && { ...oldResource, [key]: value }
    );
  };

  const updateSoilProfileCapture = (data: SoilProfileCaptureData) => {
    setResource((oldResource) => oldResource && { ...oldResource, ...data });
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
      resource={resource}
      updateFunction={updateResource}
      resourceActions={
        resource.category === 'SoilProfilePhoto'
          ? <SoilProfileCameraButton onCapture={updateSoilProfileCapture} />
          : undefined
      }
    />
  );
};

const getParam = (param: string | string[] | undefined): string | undefined =>
  Array.isArray(param) ? param[0] : param;

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
