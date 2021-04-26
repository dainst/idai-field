import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from 'mobile/App';
import { Button, Center } from 'native-base';
import React from 'react';


interface SplashScreenProps {
    navigation: StackNavigationProp<AppStackParamList, 'SplashScreen'>;
}


const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {

    return (
        <Center flex={ 1 } safeArea>
            <Button size="lg" colorScheme="lightBlue" onPress={ () => navigation.navigate('DocumentsScreen') }>
                Open test project
            </Button>
        </Center>
    );
};

export default SplashScreen;
