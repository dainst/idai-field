import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from 'mobile/App';
import { Button, Center } from 'native-base';
import React from 'react';


interface HomeScreenProps {
    navigation: StackNavigationProp<AppStackParamList, 'SplashScreen'>;
}


const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {

    return (
        <Center flex={ 1 } safeArea>
            <Button size="lg" colorScheme="lightBlue" onPress={ () => navigation.navigate('DocumentsScreen') }>
                Open test project
            </Button>
        </Center>
    );
};

export default HomeScreen;
