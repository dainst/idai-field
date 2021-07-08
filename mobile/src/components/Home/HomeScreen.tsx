import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { PouchdbManager, SampleDataLoaderBase } from 'idai-field-core';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Preferences, ProjectSettings } from '../../models/preferences';
import { colors, textColors } from '../../utils/colors';
import Button from '../common/Button';
import Column from '../common/Column';
import Row from '../common/Row';
import CreateProjectModal from './CreateProjectModal';
import DeleteProjectModal from './DeleteProjectModal';
import LoadProjectModal from './LoadProjectModal';

interface HomeScreenProps {
    preferences: Preferences;
    setCurrentProject: (project: string) => void;
    deleteProject: (project: string) => void;
    setProjectSettings: (project: string, projectSettings: ProjectSettings) => void;
    navigate: (screen: string) => void;
    pouchdbManager: PouchdbManager;
}


const HomeScreen: React.FC<HomeScreenProps> = ({
    preferences,
    setCurrentProject,
    setProjectSettings,
    deleteProject,
    navigate,
    pouchdbManager
}) => {

    const [selectedProject, setSelectedProject] = useState<string>(preferences.recentProjects[0]);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [isLoadModalOpen, setIsLoadModalOpen] = useState<boolean>(false);


    useEffect(() => setSelectedProject(preferences.recentProjects[0]), [preferences.recentProjects]);
    

    const openProject = useCallback((project: string) => {

        if (!project) return;

        setSelectedProject(project);
        setCurrentProject(project);
        navigate('ProjectScreen');
    }, [navigate, setCurrentProject]);


    const onDeleteProject = useCallback((project: string) => {

        deleteProject(project);
        if (selectedProject === project) setSelectedProject(preferences.recentProjects[0]);
    }, [selectedProject, setSelectedProject, deleteProject, preferences.recentProjects]);

    const loadProject = useCallback((project: string, url: string, password: string) => {

        if(!project) return;

        setSelectedProject(project);
        setCurrentProject(project);
        setProjectSettings(project, { url, password, connected: true });
        navigate('LoadingScreen');
    },[navigate, setCurrentProject,setProjectSettings]);


    const setTestProject = async () => {

        if(!pouchdbManager) return;

        if(preferences.projects['test']){
            openProject('test');
        } else {
            await pouchdbManager.createDb('test', { _id: 'project', resource: { id: 'project' } }, false);
            //await pouchdbManager.createDb('test')
            const loader = new SampleDataLoaderBase('en');
            await loader.go(pouchdbManager.getDb(), 'test');
            openProject('test');
        }
    };

    
    const usernameNotSet = () => preferences.username === '';

    return <>
        { isProjectModalOpen && <CreateProjectModal
            onProjectCreated={ openProject }
            onClose={ () => setIsProjectModalOpen(false) }
        /> }
        { isDeleteModalOpen && <DeleteProjectModal
            project={ selectedProject }
            onProjectDeleted={ onDeleteProject }
            onClose={ () => setIsDeleteModalOpen(false) }
        /> }
        { isLoadModalOpen && <LoadProjectModal
            onClose={ () => setIsLoadModalOpen(false) }
            onProjectLoad={ loadProject }
        /> }
        <SafeAreaView style={ styles.container } testID="home-screen">
            <Row style={ styles.topRow }>
                { usernameNotSet() &&
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
            { preferences.recentProjects.length > 0 && renderRecentProjects(
                selectedProject,
                setSelectedProject,
                preferences.recentProjects,
                openProject,
                setIsDeleteModalOpen,
                usernameNotSet()
            ) }
            <Column style={ styles.bottomRow }>
                <Button
                    icon={ <Ionicons name="add-circle" size={ 16 } /> }
                    onPress={ () => setIsProjectModalOpen(true) }
                    title="Create new project"
                    variant="success"
                    style={ styles.bottomRowButton }
                    isDisabled={ usernameNotSet() }
                />
                <Button
                    icon={ <Ionicons name="cloud-download-outline" size={ 16 } /> }
                    onPress={ () => setIsLoadModalOpen(true) }
                    title="Load project"
                    style={ styles.bottomRowButton }
                    variant="mellow"
                />
                <Button
                    icon={ <Ionicons name="folder-open" size={ 16 } /> }
                    onPress={ setTestProject }
                    title="Open test project"
                    style={ styles.bottomRowButton }
                    isDisabled={ usernameNotSet() }
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
    setIsDeleteModalOpen: (open: boolean) => void,
    usernameNotSet: boolean
) => (
    <Column style={ styles.projectPickerContainer }>
        <Text style={ { fontWeight: '600', fontSize: 16 } }>
            Open existing project:
        </Text>
        <Picker
            selectedValue={ selectedProject }
            onValueChange={ value => setSelectedProject(value.toString()) }
        >
            { recentProjects.map(project =>
                <Picker.Item label={ project } value={ project } key={ project } /> ) }
        </Picker>
        <Row>
            <Button
                style={ { marginRight: 5, flex: 1 } }
                icon={ <Ionicons name="folder-open" size={ 16 } /> }
                onPress={ () => openProject(selectedProject) }
                title="Open"
                variant="primary"
                isDisabled={ usernameNotSet }
            />
            <Button
                testID="delete-project-button"
                icon={ <Ionicons name="trash" size={ 16 } /> }
                onPress={ () => setIsDeleteModalOpen(true) }
                variant="danger"
            />
        </Row>
    </Column>
);


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ececec',
        padding: 5,
    },
    topRow: {
        justifyContent: 'flex-end',
    },
    usernameWarning: {
        backgroundColor: colors.danger,
        padding: 8,
        alignItems: 'center',
        borderRadius: 5,
    },
    usernameWarningText: {
        color: textColors.danger,
    },
    contentColumn: {
        margin: 5,
        flex: 1,
        justifyContent: 'center',
        minWidth: 300
    },
    projectPickerContainer: {
        backgroundColor: colors.secondary,
        padding: 10,
        flex: 1,
        borderRadius: 10,
        margin: 5,
        justifyContent: 'space-between',
    },
    bottomRow: {
        flex: 1,
        alignItems: 'stretch',
    },
    bottomRowButton: {
        flex: 1,
        justifyContent: 'center',
        margin: 5,
    }
});
