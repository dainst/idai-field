import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/common/Button';
import { colors } from '@/utils/colors';

interface RecentProjectsProps {
  selectedProject: string;
  setSelectedProject: (project: string) => void;
  recentProjects: string[];
  openProject: (project: string) => void;
  setIsDeleteModalOpen: (open: boolean) => void;
  usernameNotSet: boolean;
}

const RecentProjects: React.FC<RecentProjectsProps> = ({
  selectedProject,
  setSelectedProject,
  recentProjects,
  openProject,
  setIsDeleteModalOpen,
  usernameNotSet,
}) => {
  return (
    <View style={styles.projectPickerContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Open existing project:</Text>
      </View>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedProject}
          onValueChange={(value) => setSelectedProject(value.toString())}
          style={styles.picker}
        >
          {recentProjects.map((project) => (
            <Picker.Item label={project} value={project} key={project} />
          ))}
        </Picker>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          style={styles.openButton}
          icon={<Ionicons name="folder-open" size={16} />}
          onPress={() => openProject(selectedProject)}
          title="Open"
          variant="primary"
          isDisabled={usernameNotSet}
        />
        <Button
          style={styles.deleteButton}
          testID="delete-project-button"
          icon={<Ionicons name="trash" size={16} />}
          onPress={() => setIsDeleteModalOpen(true)}
          variant="danger"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  projectPickerContainer: {
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 10,
    width: '100%',
    flex: 2,
    justifyContent: 'space-between',
    minHeight: 200,
  },
  headerContainer: {
    marginBottom: 12,
  },
  headerText: {
    fontWeight: '600',
    fontSize: 16,
  },
  pickerContainer: {
    borderRadius: 8,
    flex: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  openButton: {
    flex: 2,
  },
  deleteButton: {
    flex: 1,
  },
});

export default RecentProjects;
