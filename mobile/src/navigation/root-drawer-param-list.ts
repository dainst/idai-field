import { NavigatorScreenParams } from '@react-navigation/core';
import { ResourcesStackParamList } from '../screens/ResourcesScreen';

type RootDrawerParamList = {
    Resources: NavigatorScreenParams<ResourcesStackParamList>;
};

export default RootDrawerParamList;
