import { Ionicons } from '@expo/vector-icons';
import { CategoryForm, Resource } from 'idai-field-core';
import React, { useContext, useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import { ConfigurationContext } from '@/contexts/configuration-context';
import LabelsContext from '@/contexts/labels/labels-context';
import useDocument from '@/hooks/use-document';
import useToast from '@/hooks/use-toast';

import Button from '@/components/common/Button';
import DocumentForm from '@/components/common/forms/DocumentForm';
import { ToastType } from '@/components/common/Toast/ToastProvider';
import { router, useGlobalSearchParams } from 'expo-router';
import { ProjectContext } from '@/contexts/project-context';

interface DocumentEditProps {
  docId: string;
  categoryName: string;
}

const DocumentEdit: React.FC<DocumentEditProps> = () => {
  const { showToast } = useToast();
  const { repository } = useContext(ProjectContext);

  // TODO: configure expo router to load params
  const { params } = useGlobalSearchParams();

  const config = useContext(ConfigurationContext);
  const { labels } = useContext(LabelsContext);

  const document = useDocument(repository, 'docId');
  const [category, setCategory] = useState<CategoryForm>();
  const [resource, setResource] = useState<Resource>();

  useEffect(() => setCategory(config.getCategory('categoryName')), [config]);

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
          showToast(ToastType.Success, `Edited ${doc.resource.identifier}`);
          router.setParams({
            highlightedDocId: doc.resource.id,
          });
          router.navigate('/ProjectScreen/DocumentsMap');
        })
        .catch((err) => {
          Keyboard.dismiss();
          showToast(
            ToastType.Error,
            `Could not update ${document.resource.identifier}: ${err}`
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

  if (!category || !labels || !document || !resource) return null;

  return (
    <DocumentForm
      titleBarRight={
        <Button
          variant="primary"
          onPress={editDocument}
          title="Edit"
          icon={
            <Ionicons name="create-outline" size={18} testID="editDocBtn" />
          }
        />
      }
      category={category}
      headerText={`Edit ${labels.get(category)} ${
        document.resource.identifier
      }`}
      returnBtnHandler={onReturn}
      resource={resource}
      updateFunction={updateResource}
    />
  );
};

export default DocumentEdit;
