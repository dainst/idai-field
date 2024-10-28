import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch } from 'react-native';
import { colors } from '../../../utils/colors';
import Row from '../Row';
import { FieldBaseProps } from './common-props';
import FieldLabel from './FieldLabel';

const BooleanField: React.FC<FieldBaseProps> = ({ setFunction, field, currentValue }) => {
    
    const [isEnabled, setIsEnabled] = useState<boolean>(currentValue ? true : false);
    
    useEffect(() => {
        setIsEnabled(currentValue ? true : false);
    },[currentValue]);

    const toggleSwitch = () => {

        setIsEnabled(!isEnabled);
        setFunction(field.name, !isEnabled);
    };
    
    return (
        <Row style={ styles.container }>
            <FieldLabel field={ field } style={ { borderBottomColor: colors.lightgray } } />
            <Switch
                trackColor={ { true: colors.primary, false: colors.lightgray } }
                thumbColor={ 'white' }
                value={ isEnabled }
                onValueChange={ toggleSwitch }
                testID="switch"
                style={ styles.switch } />
        </Row>
    );
};

const styles = StyleSheet.create({
    container: {
        marginLeft: 10,
        paddingLeft: 5,
        width: '98%',
        marginTop: 'auto',

    },
    switch:{
        marginLeft: 'auto'
    }
   
});
export default BooleanField;