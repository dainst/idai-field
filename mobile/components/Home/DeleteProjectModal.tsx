import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Text, View, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/common/Button';
import Heading from '@/components/common/Heading';
import Input from '@/components/common/Input';
import TitleBar from '@/components/common/TitleBar';
import { colors } from '@/utils/colors';

export const DELETE_PROJECT_CONFIRMATION_PASSWORD = '1234';

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
  const [password, setPassword] = useState<string>('');
  const insets = useSafeAreaInsets();

  const onDelete = () => {
    if (password !== DELETE_PROJECT_CONFIRMATION_PASSWORD) return;
    onProjectDeleted(project);
    setPassword('');
    onClose();
  };

  const onCancel = () => {
    setPassword('');
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
                isDisabled={password !== DELETE_PROJECT_CONFIRMATION_PASSWORD}
              />
            }
          />
          
          <View style={styles.formContainer}>
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                {project} 프로젝트와 연결된 이 기기의 로컬 데이터를 삭제합니다.
              </Text>
              <Text style={styles.confirmationText}>
                삭제 비밀번호 <Text style={styles.projectName}>
                  {DELETE_PROJECT_CONFIRMATION_PASSWORD}
                </Text>를 입력하세요.
              </Text>
            </View>
            
            <Input
              testID="delete-password-input"
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              autoFocus
              keyboardType="number-pad"
              maxLength={4}
              placeholder="삭제 비밀번호 입력"
              secureTextEntry
              style={styles.input}
              invalidText="삭제 비밀번호가 맞지 않습니다."
              isValid={password === DELETE_PROJECT_CONFIRMATION_PASSWORD || password === ''}
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
