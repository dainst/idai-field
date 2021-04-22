import { Box, Button, Text } from 'native-base';
import React from 'react';

interface DisconnectPouchFormProps {
    onDisconnect: () => void;
}

const DisconnectPouchForm: React.FC<DisconnectPouchFormProps> = ({ onDisconnect }) => {
    return (
        <Box>
            <Button colorScheme="red" onPress={ onDisconnect }>
                <Text color="white">Disconnect</Text>
            </Button>
        </Box>
    );
};

export default DisconnectPouchForm;
