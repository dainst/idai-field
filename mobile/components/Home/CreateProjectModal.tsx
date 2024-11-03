import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, View, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/common/Button';
import Heading from '@/components/common/Heading';
import Input from '@/components/common/Input';
import TitleBar from '@/components/common/TitleBar';
import { colors } from '@/utils/colors';

interface CreateProjectModalProps {
  onProjectCreated: (project: string) => void;
  onClose: () => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  onProjectCreated,
  onClose,
}) => {
  const [project, setProject] = useState<string>('');
  const insets = useSafeAreaInsets();

  const onCreate = () => {
    if (!project.trim()) return;
    onProjectCreated(project.trim());
    setProject('');
    onClose();
  };

  const onCancel = () => {
    setProject('');
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
                isDisabled={!project.trim()}
              />
            }
          />
          
          <View style={styles.formContainer}>
            <Input
              testID="project-input"
              label="Project name"
              value={project}
              onChangeText={setProject}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              autoFocus
              helpText="The project name is the unique identifier for the project. Make sure to use the exact same project name if you intend to sync to other instances of Field."
              invalidText="Project name must not be empty."
              isValid={project.trim() !== ''}
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