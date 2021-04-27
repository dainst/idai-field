import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from 'mobile/App';
import { Button, Center, Column, Icon, IconButton, Select, Text, View } from 'native-base';
import React, { SetStateAction, useCallback, useState } from 'react';
import { update } from 'tsfun';
import { Settings } from '../model/settings';


interface HomeScreenProps {
    navigation: StackNavigationProp<AppStackParamList, 'SplashScreen'>;
    setSettings: React.Dispatch<SetStateAction<Settings>>;
}


const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, setSettings }) => {

    const [selectedProject, setSelectedProject] = useState<string>('test467');

    const openProject = useCallback((project: string) => {

        setSettings(oldSettings => update('project', project, oldSettings));
        navigation.navigate('DocumentsScreen');
    }, [navigation, setSettings]);


    return (
        <View flex={ 1 } safeArea>
            <Center flex={ 1 }>
                <Column space={ 3 }>
                    <Center rounded="lg" p={ 5 } bg="gray.200">
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
                                <Select.Item label="test467" value="test467" />
                                <Select.Item label="meninx-project" value="meninx-project" />
                                <Select.Item label="uruk" value="uruk" />
                                <Select.Item label="asdf" value="asdf" />
                            </Select>
                            <IconButton
                                colorScheme="blue"
                                variant="solid"
                                icon={ <Icon name="folder-open" size={ 6 } type="Ionicons" color="white" /> }
                                onPress={ () => openProject(selectedProject) }
                            />
                        </Column>
                    </Center>
                    <Button
                        colorScheme="green"
                        startIcon={ <Icon name="add-circle" size={ 6 } type="Ionicons" color="white" /> }
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
    );
};

export default HomeScreen;
