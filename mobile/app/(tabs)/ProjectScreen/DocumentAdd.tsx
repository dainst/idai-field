import { MaterialIcons } from '@expo/vector-icons';
import {
  CategoryForm,
  Document,
  NewDocument,
  NewResource,
  Resource,
} from 'idai-field-core';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { isUndefinedOrEmpty } from 'tsfun';
import { ConfigurationContext } from '@/contexts/configuration-context';
import LabelsContext from '@/contexts/labels/labels-context';
import useDocument from '@/hooks/use-document';
import useToast from '@/hooks/use-toast';
import Button from '@/components/common/Button';
import DocumentForm from '@/components/common/forms/DocumentForm';
import SoilProfileCameraButton, {
  SoilProfileCaptureData,
} from '@/components/Project/SoilProfileCameraButton';
import { createSoilProfilePhotoDraft } from '@/components/Project/Map/korean-fieldwork-drafts';
import { ToastType } from '@/components/common/Toast/ToastProvider';
// import { DocumentsContainerDrawerParamList } from './DocumentsContainer';
import { router, useGlobalSearchParams } from 'expo-router';
import { ProjectContext } from '@/contexts/project-context';

const DocumentAdd: React.FC = () => {
  const config = useContext(ConfigurationContext);
  const { labels } = useContext(LabelsContext);
  const { repository } = useContext(ProjectContext);
  const params = useGlobalSearchParams();
  const parentDocId = getParam(params.parentDocId);
  const categoryName = getParam(params.categoryName);
  const parentDoc = useDocument(repository, parentDocId);

  const { showToast } = useToast();
  const { navigate } = router;
  const [category, setCategory] = useState<CategoryForm>();
  const [newResource, setNewResource] = useState<NewResource>();
  const [saveBtnEnabled, setSaveBtnEnabled] = useState<boolean>(false);

  const setResourceToDefault = useCallback(
    () => {
      if (!categoryName || !parentDoc) {
        setNewResource(undefined);
        return;
      }

      setNewResource(categoryName === 'SoilProfilePhoto'
        ? createSoilProfilePhotoDraft(parentDoc).resource
        : {
          identifier: '',
          relations: createRelations(parentDoc),
          category: categoryName,
        });
    },
    [parentDoc, categoryName]
  );

  useEffect(() => setResourceToDefault(), [setResourceToDefault, category]);

  useEffect(() => {
    if (newResource?.identifier) setSaveBtnEnabled(true);
    else setSaveBtnEnabled(false);
  }, [newResource]);

  // useEffect(()=> {
  //   const createRepo = async ()=> {
  //     try {
  //        await repository?.create(multiPolyTrench)
  //       // console.log(doc)
  //     } catch (error) {
  //       console.log(error)
  //     }

  //   }
  //   createRepo()
  // },[repository])
  useEffect(
    () => {
      if (categoryName) setCategory(config.getCategory(categoryName));
    },
    [config, categoryName]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateResource = (key: string, value: any) =>
    setNewResource(
      (oldResource) => oldResource && { ...oldResource, [key]: value }
    );

  const updateSoilProfileCapture = (data: SoilProfileCaptureData) => {
    setNewResource((oldResource) => oldResource && { ...oldResource, ...data });
  };

  const saveButtonHandler = () => {
    if (newResource) {
      const newDocument: NewDocument = {
        resource: newResource,
      };
      repository
        ?.create(newDocument)
        .then((doc) => {
          showToast(ToastType.Success, `${doc.resource.identifier} 기록을 만들었습니다.`);
          setResourceToDefault();
          router.navigate({
            pathname: '/ProjectScreen/DocumentsMap',
            params: {
              highlightedDocId: doc.resource.id,
            },
          });
        })
        .catch((_err) => {
          Keyboard.dismiss();
          showToast(ToastType.Error, '기록을 만들지 못했습니다.');
          console.log(_err);
        });
    }
  };

  const onReturn = () => {
    setResourceToDefault();
    navigate('/ProjectScreen/DocumentsMap');
  };

  if (!categoryName || !parentDoc || !category || !labels || !newResource) {
    return (
      <DocumentAddLoadingState
        missingItems={getMissingDependencies([
          [!repository, '저장소'],
          [!categoryName, '기록 종류'],
          [!parentDoc, '상위 기록'],
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
          onPress={saveButtonHandler}
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
      headerText={`${labels.get(category)} 만들기`}
      returnBtnHandler={onReturn}
      resource={newResource}
      updateFunction={updateResource}
      resourceActions={
        categoryName === 'SoilProfilePhoto'
          ? <SoilProfileCameraButton onCapture={updateSoilProfileCapture} />
          : undefined
      }
    />
  );
};

const createRelations = (parentDoc: Document): Resource.Relations => {
  const parentDocIsOperation = () =>
    isUndefinedOrEmpty(parentDoc.resource.relations.isRecordedIn);
  const relations: Resource.Relations = { isRecordedIn: [] };

  if (parentDocIsOperation()) {
    relations['isRecordedIn'] = [parentDoc.resource.id];
  } else {
    relations['isRecordedIn'] = [parentDoc.resource.relations.isRecordedIn[0]];
    relations['liesWithin'] = [parentDoc.resource.id];
  }
  return relations;
};

export default DocumentAdd;

const getParam = (param: string | string[] | undefined): string | undefined =>
  Array.isArray(param) ? param[0] : param;

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
