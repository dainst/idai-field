import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PreferencesContext } from '@/contexts/preferences-context';
import { colors, textColors } from '@/utils/colors';
import Button from '@/components/common/Button';
import Row from '@/components/common/Row';
import { defaultMapSettings } from '@/components/Project/Map/map-settings';
import CreateProjectModal from '@/components/Home/CreateProjectModal';
import DeleteProjectModal from '@/components/Home/DeleteProjectModal';
import LoadProjectModal from '@/components/Home/LoadProjectModal';
import { Href, router } from 'expo-router';
import RecentProjects from '@/components/Home/RecentProjects';

interface HomeScreenProps {
  deleteProject: (project: string) => void;
  navigate: (screen: Href) => void;
}

const Header: React.FC<{
  usernameNotSet: boolean;
  onSettingsPress: () => void;
}> = ({ usernameNotSet, onSettingsPress }) => (
  <Row style={styles.topRow}>
    {usernameNotSet && (
      <Row style={styles.usernameWarning}>
        <Ionicons
          name="alert-circle"
          size={16}
          style={styles.usernameWarningText}
        />
        <Text style={styles.usernameWarningText}>
          Make sure to set your name!
        </Text>
        <Ionicons
          name="arrow-forward"
          size={16}
          style={styles.usernameWarningText}
        />
      </Row>
    )}
    <Button
      icon={<Ionicons name="settings" size={16} />}
      onPress={onSettingsPress}
      variant="transparent"
    />
  </Row>
);

const BottomActions: React.FC<{
  onCreatePress: () => void;
  onLoadPress: () => void;
  onTestPress: () => void;
  isDisabled: boolean;
}> = ({ onCreatePress, onLoadPress, onTestPress, isDisabled }) => (
  <View style={styles.bottomActionsContainer}>
    <Button
      icon={<Ionicons name="add-circle" size={16} />}
      onPress={onCreatePress}
      title="Create new project"
      variant="success"
      style={styles.bottomActionButton}
      isDisabled={isDisabled}
    />
    <Button
      icon={<Ionicons name="cloud-download-outline" size={16} />}
      onPress={onLoadPress}
      title="Load project from server"
      style={styles.bottomActionButton}
      variant="mellow"
    />
    <Button
      icon={<Ionicons name="folder-open" size={16} />}
      onPress={onTestPress}
      title="Open test project"
      style={styles.bottomActionButton}
      isDisabled={isDisabled}
    />
  </View>
);

const HomeScreen: React.FC<HomeScreenProps> = ({ deleteProject }) => {
  const preferences = useContext(PreferencesContext);
  const { navigate } = router;
  const [selectedProject, setSelectedProject] = useState<string>(
    preferences.preferences.recentProjects[0]
  );
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState<boolean>(false);

  useEffect(() => {
    setSelectedProject(preferences.preferences.recentProjects[0]);
  }, [preferences.preferences.recentProjects]);

  const openProject = useCallback(
    (project: string) => {
      if (!project) return;
      setSelectedProject(project);
      preferences.setCurrentProject(project);
      navigate('/ProjectScreen');
    },
    [navigate, preferences]
  );

  const onDeleteProject = useCallback(
    (project: string) => {
      deleteProject(project);
      if (selectedProject === project)
        setSelectedProject(preferences.preferences.recentProjects[0]);
    },
    [
      selectedProject,
      setSelectedProject,
      deleteProject,
      preferences.preferences.recentProjects,
    ]
  );

  const loadProject = useCallback(
    (project: string, url: string, password: string) => {
      if (!project) return;
      setSelectedProject(project);
      preferences.setCurrentProject(project);
      preferences.setProjectSettings(project, {
        url,
        password,
        connected: true,
        mapSettings: defaultMapSettings(),
      });
    },
    [preferences]
  );

  const usernameNotSet = () => preferences.preferences.username === '';

  return (
    <SafeAreaView style={styles.container} testID="home-screen">
      {isProjectModalOpen && (
        <CreateProjectModal
          onProjectCreated={openProject}
          onClose={() => setIsProjectModalOpen(false)}
        />
      )}
      {isDeleteModalOpen && (
        <DeleteProjectModal
          project={selectedProject}
          onProjectDeleted={onDeleteProject}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      )}
      {isLoadModalOpen && (
        <LoadProjectModal
          onClose={() => setIsLoadModalOpen(false)}
          onProjectLoad={loadProject}
        />
      )}

      <View style={styles.contentContainer}>
        <Header
          usernameNotSet={usernameNotSet()}
          onSettingsPress={() => navigate('/SettingsScreen')}
        />

        <View style={styles.projectsContainer}>
          {preferences.preferences.recentProjects.length > 0 && (
            <RecentProjects
              usernameNotSet={usernameNotSet()}
              setIsDeleteModalOpen={setIsDeleteModalOpen}
              openProject={openProject}
              recentProjects={preferences.preferences.recentProjects}
              selectedProject={selectedProject}
              setSelectedProject={setSelectedProject}
            />
          )}
        </View>
        <BottomActions
          onCreatePress={() => setIsProjectModalOpen(true)}
          onLoadPress={() => setIsLoadModalOpen(true)}
          onTestPress={() => openProject('test')}
          isDisabled={usernameNotSet()}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.containerBackground,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 16,
  },
  usernameWarning: {
    backgroundColor: colors.danger,
    padding: 8,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  usernameWarningText: {
    color: textColors.danger,
    marginHorizontal: 4,
  },
  projectsContainer: {
    flex: 1,
    marginVertical: 16,
  },
  bottomActionsContainer: {
    marginTop: 16,
    gap: 8,
  },
  bottomActionButton: {
    width: '100%',
  },
});

export default HomeScreen;
