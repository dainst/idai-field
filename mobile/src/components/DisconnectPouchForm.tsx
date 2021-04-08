import React from 'react';
import { Body, Button, Card, CardItem , Text } from 'native-base';

interface DisconnectPouchFormProps {
    dbName: string;
    disconnectHandler: () => void;
}

const DisconnectPouchForm: React.FC<DisconnectPouchFormProps> = ({ dbName, disconnectHandler }) => {
    return (
        <Card>
            <CardItem header bordered>
                <Text>Disconnect {dbName}</Text>
            </CardItem>
            <Body>
                <Button danger onPress={ disconnectHandler }>
                    <Text>Disconnect</Text>
                </Button>
            </Body>

        </Card>
    );
};

export default DisconnectPouchForm;