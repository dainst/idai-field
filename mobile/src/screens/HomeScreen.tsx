import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from 'mobile/App';
import { Button, Center, Column, Icon, IconButton, Row, Select, Text, View } from 'native-base';
import React, { SetStateAction, useCallback, useState } from 'react';
import { prepend, set, update } from 'tsfun';
import CreateProjectModal from '../components/CreateProjectModal';
import { Preferences } from '../model/preferences';


interface HomeScreenProps {
    navigation: StackNavigationProp<AppStackParamList, 'SplashScreen'>;
    preferences: Preferences;
    setPreferences: React.Dispatch<SetStateAction<Preferences>>;
}


const HomeScreen: React.FC<HomeScreenProps> = ({
    navigation,
    preferences,
    setPreferences
}) => {

    const [selectedProject, setSelectedProject] = useState<string>(preferences.recentProjects[0] || '');
    const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);

    const openProject = useCallback((project: string) => {

        let newPreferences = update(['settings','project'], project, preferences);
        newPreferences = update('recentProjects', old => set(prepend(project)(old)), newPreferences);
        setPreferences(newPreferences);
        navigation.navigate('DocumentsScreen');
    }, [navigation, preferences, setPreferences]);


    return <>
        <CreateProjectModal
            isOpen={ isProjectModalOpen }
            onProjectCreated={ openProject }
            onClose={ () => setIsProjectModalOpen(false) }
        />
        <View flex={ 1 } safeArea>
            <Row justifyContent="flex-end">
                { preferences.settings.username === '' &&
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
                            <IconButton
                                colorScheme="blue"
                                variant="solid"
                                icon={ <Icon name="folder-open" size={ 6 } type="Ionicons" color="white" /> }
                                onPress={ () => openProject(selectedProject) }
                            />
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
