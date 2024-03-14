import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Dating, DatingElement } from 'idai-field-core';
import React, { useContext, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PreferencesContext } from '../../../../contexts/preferences-context';
import { colors } from '../../../../utils/colors';
import translations from '../../../../utils/translations';
import Button from '../../Button';
import Row from '../../Row';
import { FieldBaseProps } from '../common-props';
import FieldLabel from '../FieldLabel';
import AfterForm from './AfterForm';
import BeforeForm from './BeforeForm';
import ExactForm from './ExactForm';
import PeriodForm from './PeriodForm';
import ScientificForm from './ScientificForm';


const DatingField: React.FC<FieldBaseProps> = ({ field, setFunction, currentValue }) => {

    const [showAddRow, setShowAddRow] = useState<boolean>(true);
    const [type, setType] = useState<Dating.Types>('range');
    const [begin, setBegin] = useState<DatingElement>();
    const [end, setEnd] = useState<DatingElement>();
    const [isImprecise, setIsImprecise] = useState<boolean>();
    const [isUncertain, setIsUncertain] = useState<boolean>();
    const [margin, setMargin] = useState<number>();
    const [source, setSource] = useState<string>('');

    const languages = useContext(PreferencesContext).preferences.languages;

    const cancelHandler = () => setShowAddRow(true);

    const submitHandler = () => {
        const dating: Dating = {
            type,
            begin: begin ?
                begin :
                type === 'scientific' ? { year: 0, inputYear: 0, inputType: 'bce' } : undefined,
            end: end || undefined,
            isImprecise,
            isUncertain,
            source: source || undefined,
            margin
        };
        Object.keys(dating).forEach(key => dating[key] === undefined && delete dating[key]);
        Dating.addNormalizedValues(dating);
        setFunction(field.name,
            Array.isArray(currentValue) && currentValue.length ?
                [...currentValue, dating] : [dating]);
        setShowAddRow(false);
        clearStates();
    };

    const pickerSelectHandler = (selectedType: Dating.Types) => {
        
        setType(selectedType);
        clearStates(false);
    };

    const removeBtnHandler = (index: number) => {

        if(currentValue && Array.isArray(currentValue))
            setFunction(field.name, (currentValue as Dating[]).filter((_dating, i) => i !== index));
    };

    const clearStates = (clearType: boolean = true) => {

        if(clearType) setType('range');
        setBegin(undefined);
        setEnd(undefined);
        setIsImprecise(undefined);
        setIsUncertain(undefined);
        setMargin(undefined);
        setSource('');
    };

    const getLabel = (dating: Dating): string =>
        dating.label ? dating.label : Dating.generateLabel(dating, getTranslation(languages));
    
    const renderItem = ({ item, index }: {item: Dating, index: number}) => (
        <Row style={ styles.currentValues } testID={ `currentValueDating_${index}` }>
            <Text>{ getLabel(item) }</Text>
            <Button
                style={ { marginLeft: 'auto' } }
                variant="danger"
                onPress={ () => removeBtnHandler(index) }
                icon={ <Ionicons name="trash" size={ 12 }
                testID={ `datingRemove_${index}` } /> }
            />
        </Row>
    );

    return (
        <View style={ styles.container }>
            <FieldLabel field={ field } />
            <FlatList
                data={ currentValue as Dating[] }
                keyExtractor={ (item: Dating) => getLabel(item) }
                renderItem={ renderItem }
            />
            { showAddRow ?
                <Row style={ styles.addDimension } testID="addRow">
                    <Text style={ { paddingRight: 2 } }>Add</Text>
                    <TouchableOpacity onPress={ () => setShowAddRow(false) } testID="addDating">
                        <MaterialCommunityIcons name="plus-circle" size={ 20 } color={ colors.success } />
                    </TouchableOpacity>
                </Row> :
                <View testID="datingForm">
                    <Picker
                        style={ styles.typePicker }
                        selectedValue={ type }
                        onValueChange={ (itemValue) => pickerSelectHandler(itemValue as Dating.Types) }
                        itemStyle={ styles.typePickerItem }
                        testID="typePicker">
                            {Dating.VALID_TYPES.map(type =>
                                <Picker.Item value={ type } label={ type } key={ type } />)}
                    </Picker>
                    {(type === 'range') &&
                        <PeriodForm
                            begin={ begin } setBegin={ setBegin }
                            end={ end } setEnd={ setEnd }
                            isImprecise={ isImprecise } setIsImprecise={ setIsImprecise }
                            isUncertian={ isUncertain } setIsUncertian={ setIsUncertain }
                            source={ source } setSource={ setSource }
                            onCancel={ cancelHandler } onSubmit={ submitHandler } />}
                    {(type === 'single') &&
                        <ExactForm
                            end={ end } setEnd={ setEnd }
                            isUncertain={ isUncertain } setIsUncertian={ setIsUncertain }
                            source={ source } setSource={ setSource }
                            onCancel={ cancelHandler } onSubmit={ submitHandler } />}
                    {(type === 'before') &&
                        <BeforeForm
                            end={ end } setEnd={ setEnd }
                            isImprecise={ isImprecise } setIsImprecise={ setIsImprecise }
                            isUncertian={ isUncertain } setIsUncertian={ setIsUncertain }
                            source={ source } setSource={ setSource }
                            onCancel={ cancelHandler } onSubmit={ submitHandler } />}
                    {(type === 'after') &&
                        <AfterForm
                            begin={ begin } setBegin={ setBegin }
                            isImprecise={ isImprecise } setIsImprecise={ setIsImprecise }
                            isUncertian={ isUncertain } setIsUncertian={ setIsUncertain }
                            source={ source } setSource={ setSource }
                            onCancel={ cancelHandler } onSubmit={ submitHandler } />}
                    {(type === 'scientific') &&
                        <ScientificForm
                            end={ end } setEnd={ setEnd }
                            margin={ margin } setMargin={ setMargin }
                            source={ source } setSource={ setSource }
                            onCancel={ cancelHandler } onSubmit={ submitHandler } />}
                </View>
            }
        </View>
    );
};


const getTranslation = (_languages: string[]) =>
    (key: string) => translations[key];

const styles = StyleSheet.create({
    container: {
        margin: 5,
        padding: 5,
        width: '100%'
    },
    addDimension: {
        marginTop: 3,
        padding: 3,
        borderColor: colors.lightgray,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'flex-end'
    },
    currentValues: {
        marginTop: 3,
        padding: 3,
        borderColor: colors.lightgray,
        borderWidth: 1,
        alignItems: 'center',
    },
    typePicker: {
        width: '100%',
        height: 100,
        marginLeft: 5,
        marginRight: '40%',
    },
    typePickerItem: {
        height: 100,
        fontSize: 18
    },
});

export default DatingField;