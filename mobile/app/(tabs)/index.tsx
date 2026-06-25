import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import { SAMPLE_PROJECT_ID } from '@/constants/sample-project';

interface HomeScreenProps {
  deleteProject?: (project: string) => void;
  navigate?: (screen: Href) => void;
}

const Header: React.FC<{
  usernameNotSet: boolean;
  onSettingsPress: () => void;
}> = ({ usernameNotSet, onSettingsPress }) => (
  <Row style={styles.topRow}>
    {usernameNotSet && (
      <TouchableOpacity
        activeOpacity={0.86}
        accessibilityLabel="작업자 이름과 프로젝트 기본 설정 열기"
        accessibilityRole="button"
        onPress={onSettingsPress}
        style={styles.usernameWarning}
        testID="username-warning-settings-button"
      >
        <Ionicons
          name="alert-circle"
          size={16}
          style={styles.usernameWarningText}
        />
        <Text style={styles.usernameWarningText}>
          설정 확인 필요
        </Text>
        <Ionicons
          name="arrow-forward"
          size={16}
          style={styles.usernameWarningText}
        />
      </TouchableOpacity>
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
}> = ({ onCreatePress, onLoadPress, onTestPress }) => (
  <View style={styles.bottomActionsContainer}>
    <Button
      icon={<Ionicons name="add-circle" size={16} />}
      onPress={onCreatePress}
      title="새 프로젝트 만들기"
      variant="success"
      style={styles.bottomActionButton}
      testID="create-project-button"
    />
    <Button
      icon={<Ionicons name="cloud-download-outline" size={16} />}
      onPress={onLoadPress}
      title="서버에서 프로젝트 가져오기"
      style={styles.bottomActionButton}
      variant="mellow"
      testID="load-project-button"
    />
    <Button
      icon={<Ionicons name="folder-open" size={16} />}
      onPress={onTestPress}
      title="테스트 프로젝트 열기"
      style={styles.bottomActionButton}
      testID="sample-project-button"
    />
  </View>
);

const HomeScreen: React.FC<HomeScreenProps> = ({ deleteProject }) => {
  const preferences = useContext(PreferencesContext);
  const { navigate } = router;
  const [selectedProject, setSelectedProject] = useState<string>(
    preferences.preferences.recentProjects[0] ?? ''
  );
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState<boolean>(false);

  useEffect(() => {
    setSelectedProject((currentProject) =>
      preferences.preferences.recentProjects.includes(currentProject)
        ? currentProject
        : preferences.preferences.recentProjects[0] ?? ''
    );
  }, [preferences.preferences.recentProjects]);

  const openProject = useCallback(
    (project: string, languages?: string[]) => {
      if (!project) return;
      setSelectedProject(project);
      preferences.setCurrentProject(project, languages, {
        includeInRecentProjects: project !== SAMPLE_PROJECT_ID,
      });
      navigate('/ProjectScreen');
    },
    [navigate, preferences]
  );

  const onDeleteProject = useCallback(
    (project: string) => {
      const nextProject = preferences.preferences.recentProjects.find(
        (recentProject) => recentProject !== project
      ) ?? '';

      (deleteProject ?? preferences.removeProject)(project);

      if (selectedProject === project)
        setSelectedProject(nextProject);
    },
    [
      selectedProject,
      setSelectedProject,
      deleteProject,
      preferences,
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
      navigate('/ProjectScreen');
    },
    [navigate, preferences]
  );

  const usernameNotSet = () => preferences.preferences.username === '';
  const existingProjects = Array.from(new Set([
    ...preferences.preferences.recentProjects,
    ...Object.keys(preferences.preferences.projects),
  ]));

  return (
    <SafeAreaView style={styles.container} testID="home-screen">
      {isProjectModalOpen && (
        <CreateProjectModal
          existingProjects={existingProjects}
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
          existingProjects={existingProjects}
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
          onTestPress={() => openProject(SAMPLE_PROJECT_ID)}
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
    marginBottom: 12,
    marginTop: 8,
  },
  bottomActionsContainer: {
    marginTop: 8,
    gap: 8,
  },
  bottomActionButton: {
    width: '100%',
  },
});

export default HomeScreen;
