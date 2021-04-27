import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from 'mobile/App';
import { Button, Center, Column, Icon, IconButton, Row, Select, View } from 'native-base';
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
                        <Row space={ 3 }>
                            <Center flex={ 1 } _text={ { fontWeight: 'bold' } }>
                                Open existing project:
                            </Center>
                            <Select
                                selectedValue={ selectedProject }
                                minWidth={ 200 }
                                onValueChange={ setSelectedProject }
                            >
                                <Select.Item label="test467" value="test467" />
                                <Select.Item label="meninx-project" value="meninx-project" />
                                <Select.Item label="uruk" value="uruk" />
                                <Select.Item label="asdf" value="asdf" />
                            </Select>
                            <Center flex={ 1 }>
                                <IconButton
                                    colorScheme="blue"
                                    variant="solid"
                                    icon={ <Icon name="folder-open" size={ 6 } type="Ionicons" color="white" /> }
                                    onPress={ () => openProject(selectedProject) }
                                />
                            </Center>
                        </Row>
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
