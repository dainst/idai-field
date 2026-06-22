import { Ionicons } from '@expo/vector-icons';
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

const DEFAULT_PROJECT_LANGUAGES = ['en'];
const KOREAN_FIELDWORK_LANGUAGES = ['ko', 'en'];
const KOREAN_FIELDWORK_PROJECT_PREFIX = 'korean-fieldwork-';

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  onProjectCreated,
  onClose,
}) => {
  const [project, setProject] = useState<string>('');
  const [projectType, setProjectType] = useState<'default' | 'koreanFieldwork'>('default');
  const insets = useSafeAreaInsets();
  const isKoreanFieldwork = projectType === 'koreanFieldwork';
  const isProjectValid = isKoreanFieldwork
    ? project.trim().length > KOREAN_FIELDWORK_PROJECT_PREFIX.length
    : project.trim() !== '';

  const onCreate = () => {
    if (!isProjectValid) return;
    onProjectCreated(
      project.trim(),
      isKoreanFieldwork ? KOREAN_FIELDWORK_LANGUAGES : DEFAULT_PROJECT_LANGUAGES
    );
    setProject('');
    setProjectType('default');
    onClose();
  };

  const onCancel = () => {
    setProject('');
    setProjectType('default');
    onClose();
  };

  const selectProjectType = (type: 'default' | 'koreanFieldwork') => {
    setProjectType(type);
    setProject((currentProject) => {
      if (type === 'koreanFieldwork' && !currentProject.trim()) return KOREAN_FIELDWORK_PROJECT_PREFIX;
      if (type === 'default' && currentProject === KOREAN_FIELDWORK_PROJECT_PREFIX) return '';
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
            title={<Heading>Create project</Heading>}
            left={
              <Button
                title="Cancel"
                variant="transparent"
                icon={<Ionicons name="close-outline" size={16} />}
                onPress={onCancel}
              />
            }
            right={
              <Button
                title="Create"
                variant="success"
                onPress={onCreate}
                isDisabled={!isProjectValid}
              />
            }
          />
          
          <View style={styles.formContainer}>
            <Text style={styles.label}>Project type</Text>
            <View style={styles.projectTypeButtons}>
              <Button
                testID="project-type-default"
                title="Default"
                variant={projectType === 'default' ? 'primary' : 'secondary'}
                onPress={() => selectProjectType('default')}
                style={styles.projectTypeButton}
              />
              <Button
                testID="project-type-korean-fieldwork"
                title="한국형 야장"
                variant={isKoreanFieldwork ? 'primary' : 'secondary'}
                onPress={() => selectProjectType('koreanFieldwork')}
                style={styles.projectTypeButton}
              />
            </View>
            <Input
              testID="project-input"
              label="Project name"
              value={project}
              onChangeText={setProject}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              autoFocus
              helpText={isKoreanFieldwork
                ? '한국형 야장은 korean-fieldwork- 접두어와 ko/en 프로젝트 언어를 사용합니다.'
                : 'The project name is the unique identifier for the project. Make sure to use the exact same project name if you intend to sync to other instances of Field.'}
              invalidText="Project name must not be empty."
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
