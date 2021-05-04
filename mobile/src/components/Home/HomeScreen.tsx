import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from 'mobile/App';
import { Button, Center, Column, Icon, IconButton, Row, Select, Text, View } from 'native-base';
import React, { useCallback, useState } from 'react';
import { Preferences } from '../../model/preferences';
import CreateProjectModal from './CreateProjectModal';
import DeleteProjectModal from './DeleteProjectModal';


interface HomeScreenProps {
    navigation: StackNavigationProp<AppStackParamList, 'HomeScreen'>;
    preferences: Preferences;
    setCurrentProject: (project: string) => void;
    deleteProject: (project: string) => void;
}


const HomeScreen: React.FC<HomeScreenProps> = ({
    navigation,
    preferences,
    setCurrentProject,
    deleteProject
}) => {

    const [selectedProject, setSelectedProject] = useState<string>(preferences.recentProjects[0]);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    

    const openProject = useCallback((project: string) => {

        if (!project) return;

        setSelectedProject(project);
        setCurrentProject(project);
        navigation.navigate('DocumentsScreen');
    }, [navigation, setCurrentProject]);


    const onDeleteProject = useCallback((project: string) => {

        if (selectedProject === project) setSelectedProject(preferences.recentProjects[0]);
        deleteProject(project);
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
        <View flex={ 1 } safeArea>
            <Row justifyContent="flex-end">
                { preferences.username === '' &&
                    <Row bg="red.200" p={ 2 } alignItems="center" rounded="lg" space={ 2 }>
                        <Icon type="Ionicons" name="alert-circle" color="red" />
                        <Text color="red.600" bold>Make sure to set your name!</Text>
                        <Icon type="Ionicons" name="arrow-forward" />
                    </Row>
                }
                <IconButton
                    icon={ <Icon type="Ionicons" name="settings" /> }
                    onPress={ () => navigation.navigate('SettingsScreen') }
                />
            </Row>
            <Center flex={ 1 }>
                <Column space={ 3 }>
                    { preferences.recentProjects.length > 0 && <Center rounded="lg" p={ 5 } bg="gray.200">
                        <Column space={ 3 }>
                            <Text style={ { fontWeight: 'bold' } }>
                                Open existing project:
                            </Text>
                            <Select
                                variant="native"
                                selectedValue={ selectedProject }
                                minWidth={ 200 }
                                minHeight={ 10 }
                                onValueChange={ setSelectedProject }
                                androidIconColor="gray"
                                androidPrompt="Select project:"
                            >
                                { preferences.recentProjects.map(project =>
                                    <Select.Item label={ project }value={ project } key={ project } /> ) }
                            </Select>
                            <View style={ { flexDirection: 'row' } }>
                                <Button
                                    style={ { flex: 1 } }
                                    mr={ 1 }
                                    colorScheme="blue"
                                    variant="solid"
                                    startIcon={ <Icon name="folder-open" size={ 6 } type="Ionicons" color="white" /> }
                                    onPress={ () => openProject(selectedProject) }
                                >
                                    Open
                                </Button>
                                <IconButton
                                    p={ 3 }
                                    colorScheme="red"
                                    variant="solid"
                                    icon={ <Icon name="trash" size={ 6 } type="Ionicons" color="white" /> }
                                    onPress={ () => setIsDeleteModalOpen(true) }
                                />
                            </View>
                        </Column>
                    </Center> }
                    <Button
                        colorScheme="green"
                        startIcon={ <Icon name="add-circle" size={ 6 } type="Ionicons" color="white" /> }
                        onPress={ () => setIsProjectModalOpen(true) }
                    >
                        Create new project
                    </Button>
                    <Button
                        colorScheme="yellow"
                        startIcon={ <Icon name="folder-open" size={ 6 } type="Ionicons" /> }
                        onPress={ () => openProject('test') }
                    >
                        Open test project
                    </Button>
                </Column>
            </Center>
        </View>
    </>;
};

export default HomeScreen;
