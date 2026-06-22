import { Ionicons } from '@expo/vector-icons';
import {
  KOREAN_FIELDWORK_PROJECT_LABEL,
  KOREAN_FIELDWORK_PROJECT_LANGUAGES,
  KOREAN_FIELDWORK_PROJECT_PREFIX,
} from '@/constants/korean-fieldwork-project';
import React, { useState } from 'react';
import { Modal, View, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
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

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  onProjectCreated,
  onClose,
}) => {
  const [project, setProject] = useState<string>(KOREAN_FIELDWORK_PROJECT_PREFIX);
  const insets = useSafeAreaInsets();
  const isProjectValid = project.trim().length > KOREAN_FIELDWORK_PROJECT_PREFIX.length;

  const onCreate = () => {
    if (!isProjectValid) return;
    onProjectCreated(
      project.trim(),
      KOREAN_FIELDWORK_PROJECT_LANGUAGES.slice()
    );
    setProject(KOREAN_FIELDWORK_PROJECT_PREFIX);
    onClose();
  };

  const onCancel = () => {
    setProject(KOREAN_FIELDWORK_PROJECT_PREFIX);
    onClose();
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
            <Input
              testID="project-input"
              label={`${KOREAN_FIELDWORK_PROJECT_LABEL} 프로젝트 이름`}
              value={project}
              onChangeText={setProject}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              autoFocus
              helpText={`${KOREAN_FIELDWORK_PROJECT_PREFIX} 접두어와 한국어 야장 설정을 사용합니다. 다른 기기와 동기화하려면 같은 이름을 정확히 사용하세요.`}
              invalidText="접두어 뒤에 현장 이름을 입력해야 합니다."
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
});

export default CreateProjectModal;
