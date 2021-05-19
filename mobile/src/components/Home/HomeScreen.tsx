import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Preferences } from '../../models/preferences';
import { colors, textColors } from '../../utils/colors';
import Button from '../common/Button';
import Column from '../common/Column';
import Row from '../common/Row';
import CreateProjectModal from './CreateProjectModal';
import DeleteProjectModal from './DeleteProjectModal';


interface HomeScreenProps {
    preferences: Preferences;
    setCurrentProject: (project: string) => void;
    deleteProject: (project: string) => void;
    navigate: (screen: string) => void;
}


const HomeScreen: React.FC<HomeScreenProps> = ({
    preferences,
    setCurrentProject,
    deleteProject,
    navigate,
}) => {

    const [selectedProject, setSelectedProject] = useState<string>(preferences.recentProjects[0]);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);


    useEffect(() => setSelectedProject(preferences.recentProjects[0]), [preferences.recentProjects]);
    

    const openProject = useCallback((project: string) => {

        if (!project) return;

        setSelectedProject(project);
        setCurrentProject(project);
        navigate('DocumentsScreen');
    }, [navigate, setCurrentProject]);


    const onDeleteProject = useCallback((project: string) => {

        deleteProject(project);
        if (selectedProject === project) setSelectedProject(preferences.recentProjects[0]);
    }, [selectedProject, setSelectedProject, deleteProject, preferences.recentProjects]);


    return <>
        <CreateProjectModal
            isOpen={ isProjectModalOpen }
            onProjectCreated={ openProject }
            onClose={ () => setIsProjectModalOpen(false) }
        />
        <DeleteProjectModal
            project={ selectedProject }
            isOpen={ isDeleteModalOpen }
            onProjectDeleted={ onDeleteProject }
            onClose={ () => setIsDeleteModalOpen(false) }
        />
        <SafeAreaView style={ { flex: 1 } }>
            <Row style={ { justifyContent: 'flex-end' } }>
                { preferences.username === '' &&
                    <Row style={ styles.usernameWarning }>
                        <Ionicons name="alert-circle" size={ 16 } style={ styles.usernameWarningText } />
                        <Text style={ styles.usernameWarningText }>Make sure to set your name!</Text>
                        <Ionicons name="arrow-forward" size={ 16 } style={ styles.usernameWarningText } />
                    </Row>
                }
                <Button
                    icon={ <Ionicons name="settings" size={ 16 } /> }
                    onPress={ () => navigate('SettingsScreen') }
                    variant="transparent"
                />
            </Row>
            <Column style={ { margin: 3 } }>
                { preferences.recentProjects.length > 0 && renderRecentProjects(
                    selectedProject,
                    setSelectedProject,
                    preferences.recentProjects,
                    openProject,
                    setIsDeleteModalOpen
                ) }
                <Button
                    icon={ <Ionicons name="add-circle" size={ 16 } /> }
                    onPress={ () => setIsProjectModalOpen(true) }
                    title="Create new project"
                    variant="success"
                />
                <Button
                    icon={ <Ionicons name="folder-open" size={ 16 } /> }
                    onPress={ () => openProject('test') }
                    title="Open test project"
                />
            </Column>
        </SafeAreaView>
    </>;
};

export default HomeScreen;


const renderRecentProjects = (
    selectedProject: string,
    setSelectedProject: React.Dispatch<React.SetStateAction<string>>,
    recentProjects: string[],
    openProject: (project: string) => void,
    setIsDeleteModalOpen: (open: boolean) => void
) =>
<Column style={ { margin: 3 } }>
    <Text style={ { fontWeight: 'bold' } }>
        Open existing project:
    </Text>
    <Picker
        selectedValue={ selectedProject }
        onValueChange={ setSelectedProject }
    >
        { recentProjects.map(project =>
            <Picker.Item label={ project }value={ project } key={ project } /> ) }
    </Picker>
    <View style={ { flexDirection: 'row' } }>
        <Button
            style={ { marginRight: 1 } }
            icon={ <Ionicons name="folder-open" size={ 16 } /> }
            onPress={ () => openProject(selectedProject) }
            title="Open"
            variant="primary"
        />
        <Button
            icon={ <Ionicons name="trash" size={ 16 } /> }
            onPress={ () => setIsDeleteModalOpen(true) }
            variant="danger"
        />
    </View>
</Column>;


const styles = StyleSheet.create({
    usernameWarning: {
        backgroundColor: colors.danger,
        padding: 8,
        alignItems: 'center',
        borderRadius: 5,
    },
    usernameWarningText: {
        color: textColors.danger,
    }
});
