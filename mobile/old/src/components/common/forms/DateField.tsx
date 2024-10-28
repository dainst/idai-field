import DateTimePicker from '@react-native-community/datetimepicker';
import dateFormat from 'dateformat';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../utils/colors';
import { FieldBaseProps } from './common-props';
import FieldLabel from './FieldLabel';

const DateField: React.FC<FieldBaseProps> = ({ field, setFunction, currentValue }) => {

    const [date, setDate] = useState<Date>();
    const [show, setShow] = useState<boolean>(false);


    useEffect(() => {
        if(currentValue && typeof currentValue === 'string'){
            const [day, month, year] = currentValue.split('.');
            setDate(new Date(`${year}-${month}-${day}`));
        }
    },[currentValue]);


    const changeHandler = (_event, selectedDate) => {

        setShow(Platform.OS === 'ios');
        setDate(selectedDate);
        setFunction(field.name, formatDate(selectedDate));
    };

    
    return (
        <View style={ styles.container }>
            <TouchableOpacity onPress={ () => setShow(true) }>
                <FieldLabel field={ field } />
            </TouchableOpacity>
            {show && <DateTimePicker
                value={ date || new Date() }
                mode="date"
                onChange={ changeHandler }
                textColor="blue"
                display="default"
            />}
            { (date && Platform.OS === 'android') &&
                <Text style={ styles.date }>{formatDate(date)}</Text>}
        </View>
    );
};

const formatDate = (date: Date) => dateFormat(date,'dd.mm.yyyy');

const styles = StyleSheet.create({
    container: {
        margin: 5,
        padding: 5,
        width: '100%'
    },
    date: {
        marginTop: 3,
        borderColor: colors.lightgray,
        borderWidth: 1,
        padding: 3
    },
});

export default DateField;