import { Ionicons } from '@expo/vector-icons';
import {
  DEFAULT_PROJECT_LANGUAGES,
  KOREAN_FIELDWORK_PROJECT_LABEL,
  KOREAN_FIELDWORK_PROJECT_LANGUAGES,
  KOREAN_FIELDWORK_PROJECT_PREFIX,
  KOREAN_FIELDWORK_TEMPLATE_ID,
} from 'idai-field-core';
import React, { useState } from 'react';
import { Modal, View, StyleSheet, Platform, KeyboardAvoidingView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/common/Button';
import Heading from '@/components/common/Heading';
import Input from '@/components/common/Input';
import TitleBar from '@/components/common/TitleBar';
import { colors } from '@/utils/colors';

interface CreateProjectModalProps {
  onProjectCreated: (project: string, languages?: string[]) => void;
  onClose: () => void;
}

const DEFAULT_PROJECT_TYPE = 'default';
type ProjectType = typeof DEFAULT_PROJECT_TYPE | typeof KOREAN_FIELDWORK_TEMPLATE_ID;

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  onProjectCreated,
  onClose,
}) => {
  const [project, setProject] = useState<string>('');
  const [projectType, setProjectType] = useState<ProjectType>(DEFAULT_PROJECT_TYPE);
  const insets = useSafeAreaInsets();
  const isKoreanFieldwork = projectType === KOREAN_FIELDWORK_TEMPLATE_ID;
  const isProjectValid = isKoreanFieldwork
    ? project.trim().length > KOREAN_FIELDWORK_PROJECT_PREFIX.length
    : project.trim() !== '';

  const onCreate = () => {
    if (!isProjectValid) return;
    onProjectCreated(
      project.trim(),
      (isKoreanFieldwork ? KOREAN_FIELDWORK_PROJECT_LANGUAGES : DEFAULT_PROJECT_LANGUAGES).slice()
    );
    setProject('');
    setProjectType(DEFAULT_PROJECT_TYPE);
    onClose();
  };

  const onCancel = () => {
    setProject('');
    setProjectType(DEFAULT_PROJECT_TYPE);
    onClose();
  };

  const selectProjectType = (type: ProjectType) => {
    setProjectType(type);
    setProject((currentProject) => {
      if (type === KOREAN_FIELDWORK_TEMPLATE_ID && !currentProject.trim()) return KOREAN_FIELDWORK_PROJECT_PREFIX;
      if (type === DEFAULT_PROJECT_TYPE && currentProject === KOREAN_FIELDWORK_PROJECT_PREFIX) return '';
      return currentProject;
    });
  };

  return (
    <Modal
      onRequestClose={onCancel}
      animationType="slide"
      presentationStyle="formSheet"
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          }
        ]}
      >
        <View style={styles.content}>
          <TitleBar
            title={<Heading>새 프로젝트 만들기</Heading>}
            left={
              <Button
                title="닫기"
                variant="transparent"
                icon={<Ionicons name="close-outline" size={16} />}
                onPress={onCancel}
              />
            }
            right={
              <Button
                title="만들기"
                variant="success"
                onPress={onCreate}
                isDisabled={!isProjectValid}
              />
            }
          />
          
          <View style={styles.formContainer}>
            <Text style={styles.label}>프로젝트 유형</Text>
            <View style={styles.projectTypeButtons}>
              <Button
                testID="project-type-default"
                title="기본 iDAI"
                variant={projectType === DEFAULT_PROJECT_TYPE ? 'primary' : 'secondary'}
                onPress={() => selectProjectType(DEFAULT_PROJECT_TYPE)}
                style={styles.projectTypeButton}
              />
              <Button
                testID="project-type-korean-fieldwork"
                title={KOREAN_FIELDWORK_PROJECT_LABEL}
                variant={isKoreanFieldwork ? 'primary' : 'secondary'}
                onPress={() => selectProjectType(KOREAN_FIELDWORK_TEMPLATE_ID)}
                style={styles.projectTypeButton}
              />
            </View>
            <Input
              testID="project-input"
              label="프로젝트 이름"
              value={project}
              onChangeText={setProject}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              autoFocus
              helpText={isKoreanFieldwork
                ? `${KOREAN_FIELDWORK_PROJECT_LABEL}은 ${KOREAN_FIELDWORK_PROJECT_PREFIX} 접두어와 한국어 야장 설정을 사용합니다.`
                : '프로젝트 이름은 동기화에 쓰이는 고유 식별자입니다. 다른 기기와 동기화하려면 같은 이름을 정확히 사용하세요.'}
              invalidText="프로젝트 이름을 입력해야 합니다."
              isValid={isProjectValid}
              style={styles.input}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.containerBackground,
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  formContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 32,
  },
  input: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    margin: 5,
    fontWeight: '500',
  },
  projectTypeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  projectTypeButton: {
    flex: 1,
  },
});

export default CreateProjectModal;
