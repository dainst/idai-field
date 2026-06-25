import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/common/Button';
import { colors } from '@/utils/colors';
import { getProjectDisplayName } from '@/constants/sample-project';

interface RecentProjectsProps {
  selectedProject: string;
  setSelectedProject: (project: string) => void;
  recentProjects: string[];
  openProject: (project: string) => void;
  setIsDeleteModalOpen: (open: boolean) => void;
}

const RecentProjects: React.FC<RecentProjectsProps> = ({
  selectedProject,
  setSelectedProject,
  recentProjects,
  openProject,
  setIsDeleteModalOpen,
}) => {
  return (
    <View style={styles.projectPickerContainer} testID="recent-projects-card">
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>기존 프로젝트 열기</Text>
      </View>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedProject}
          onValueChange={(value) => setSelectedProject(value.toString())}
          style={styles.picker}
        >
          {recentProjects.map((project) => (
            <Picker.Item
              label={getProjectDisplayName(project)}
              value={project}
              key={project}
            />
          ))}
        </Picker>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          style={styles.openButton}
          icon={<Ionicons name="folder-open" size={16} />}
          onPress={() => openProject(selectedProject)}
          title="열기"
          variant="primary"
          testID="open-project-button"
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
    borderRadius: 8,
    width: '100%',
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
