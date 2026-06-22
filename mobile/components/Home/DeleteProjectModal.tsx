import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Text, View, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/common/Button';
import Heading from '@/components/common/Heading';
import Input from '@/components/common/Input';
import TitleBar from '@/components/common/TitleBar';
import { colors } from '@/utils/colors';

interface DeleteProjectModalProps {
  project: string;
  onProjectDeleted: (project: string) => void;
  onClose: () => void;
}

const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  project,
  onProjectDeleted,
  onClose,
}) => {
  const [projectVal, setProjectVal] = useState<string>('');
  const insets = useSafeAreaInsets();

  const onDelete = () => {
    if (projectVal !== project) return;
    onProjectDeleted(project);
    setProjectVal('');
    onClose();
  };

  const onCancel = () => {
    setProjectVal('');
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
            title={<Heading>프로젝트 삭제</Heading>}
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
                title="삭제"
                variant="danger"
                onPress={onDelete}
                isDisabled={project !== projectVal}
              />
            }
          />
          
          <View style={styles.formContainer}>
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                프로젝트와 연결된 모든 로컬 데이터를 삭제합니다.
              </Text>
              <Text style={styles.confirmationText}>
                삭제하려면 <Text style={styles.projectName}>{project}</Text>를 정확히 입력하세요.
              </Text>
            </View>
            
            <Input
              testID="project-input"
              value={projectVal}
              onChangeText={setProjectVal}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              autoFocus
              placeholder="프로젝트 이름 입력"
              style={styles.input}
              invalidText="프로젝트 이름이 정확히 일치해야 합니다."
              isValid={projectVal === project || projectVal === ''}
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
  warningContainer: {
    marginBottom: 24,
  },
  warningText: {
    fontSize: 16,
    marginBottom: 8,
  },
  confirmationText: {
    fontSize: 16,
    marginBottom: 16,
  },
  projectName: {
    fontWeight: '600',
    color: colors.danger,
  },
  input: {
    width: '100%',
  },
});

export default DeleteProjectModal;
