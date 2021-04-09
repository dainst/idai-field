//import liraries
import React, { useContext, useState, useEffect, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { Container, Text, Card, CardItem } from 'native-base';
import PouchDbContext from '../data/pouchdb/pouch-context';


const HomeScreen= (): ReactElement => {
    
    const [operations, setOperations] = useState<any[] | undefined>();
    const pouchCtx = useContext(PouchDbContext);

    useEffect(() => {
        
        setOperations(pouchCtx.operations);
    }, [pouchCtx, pouchCtx.operations]);


    const renderStatus = () => {
        const connected = pouchCtx.status && pouchCtx.status.status === 200 ? true : false;
        return (
            <Card style={ styles.card }>
                <CardItem header bordered >
                    <Text style={ connected? styles.green : styles.red }>
                        {connected ? 'Connected' : 'Not Connected'}
                    </Text>
                </CardItem>
                {operations && operations.map(operation => (
                    <CardItem key={ operation._id }>
                        <Text>{operation.resource.id}</Text>
                    </CardItem>
                ))}
            </Card>);
    };

    
    return (
        <Container style={ styles.container }>
            {renderStatus()}
        </Container>
    );
};


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


export default HomeScreen;
