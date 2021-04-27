import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from 'mobile/App';
import { Button, Center } from 'native-base';
import React, { SetStateAction, useCallback } from 'react';
import { update } from 'tsfun';
import { Settings } from '../model/settings';


interface HomeScreenProps {
    navigation: StackNavigationProp<AppStackParamList, 'SplashScreen'>;
    setSettings: React.Dispatch<SetStateAction<Settings>>;
}


const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, setSettings }) => {


    const openProject = useCallback((project: string) => {

        setSettings(oldSettings => update('project', project, oldSettings));
        navigation.navigate('DocumentsScreen');
    }, [navigation, setSettings]);


    return (
        <Center flex={ 1 } safeArea>
            <Button size="lg" colorScheme="lightBlue" onPress={ () => openProject('test467') }>
                Open test project
            </Button>
        </Center>
    );
};

export default HomeScreen;
