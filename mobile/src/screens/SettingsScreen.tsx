import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from 'mobile/App';
import { Button, Center, View } from 'native-base';
import React, { SetStateAction } from 'react';
import { Settings } from '../model/settings';


interface SettingsScreenProps {
    navigation: StackNavigationProp<AppStackParamList, 'SplashScreen'>;
    setSettings: React.Dispatch<SetStateAction<Settings>>;
}


const SettingsScreen: React.FC<SettingsScreenProps> = ({
    navigation,
    setSettings
}) => {

    return (
        <View flex={ 1 } safeArea>
            <Center flex={ 1 }>
                <Button onPress={ () => navigation.goBack() }>
                    Cancel
                </Button>
            </Center>
        </View>
    );
};

export default SettingsScreen;
