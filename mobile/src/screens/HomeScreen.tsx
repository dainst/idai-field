//import liraries
import React, { useContext, useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Container, Text, Card, CardItem } from 'native-base';
import PouchDbContext from '../data/pouchdb/pouch-context';

// create a component
const HomeScreen: React.FC = () => {
    const [operations, setOperations] = useState<any[] | undefined>();


    const pouchCtx = useContext(PouchDbContext);

    useEffect(() => {
        
        setOperations(pouchCtx.getOperations());
    }, [pouchCtx, pouchCtx.dbName]);

    const renderStatus = () => {
        const connected = pouchCtx.status && pouchCtx.status.status === 200 ? true : false;
        return (
            <Card style={ styles.card }>
                <CardItem header bordered >
                    <Text style={ connected? styles.green : styles.red }>
                        {connected ? 'Connected' : 'Not Connected'}
                    </Text>
                </CardItem>
            </Card>);
    };

    
    return (
        <Container style={ styles.container }>
            {renderStatus()}
        </Container>
    );
};

// define your styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
    },
    card: {
        width: '90%',
        alignItems: 'center'
    },
    red: {
        color: 'red',
    },
    green: {
        color: 'green',
    },
});

//make this component available to the app
export default HomeScreen;
