import { NavigatorScreenParams } from '@react-navigation/core';
import { HomeStackParamList } from '../screens/HomeScreen';

type RootDrawerParamList = {
    Home: NavigatorScreenParams<HomeStackParamList>;
};

export default RootDrawerParamList;
