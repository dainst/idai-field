import React from 'react';
import { View } from 'react-native';


type IconProps = {
    size?: number;
    name: string;
    testId?: string
};

export const Ionicons: React.FC<IconProps> = (props) => {
    return (
        <View { ...props }></View>
    );
};


export const MaterialCommunityIcons: React.FC<IconProps> = (props) => {
    return (
        <View { ...props }></View>
    );
};


export const MaterialIcons: React.FC<IconProps> = (props) => {
    return (
        <View { ...props }></View>
    );
};