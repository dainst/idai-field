import { Ionicons } from '@expo/vector-icons';
import { Document } from 'idai-field-core';
import React, { useContext, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { ConfigurationContext } from '../../contexts/configuration-context';
import Button from '../common/Button';
import Card from '../common/Card';
import CategoryIcon from '../common/CategoryIcon';
import Heading from '../common/Heading';
import Input from '../common/Input';
import TitleBar from '../common/TitleBar';

interface RemoveModalProps {
  doc: Document | undefined;
  onClose: () => void;
  onRemoveDocument: (doc: Document | undefined) => void;
}

const DocumentRemoveModal: React.FC<RemoveModalProps> = ({
  doc,
  onClose,
  onRemoveDocument,
}) => {
  const config = useContext(ConfigurationContext);

  const [docValue, setDocValue] = useState<string>('');

  if (!doc) return null;

  const identifier = doc.resource.identifier;
  const category = config.getCategory(doc.resource.category);

  if (!category) return null;

  return (
    <Modal
      onRequestClose={onClose}
      animationType="fade"
      transparent
      visible={true}
    >
      <View style={styles.container}>
        <Card style={styles.card}>
          <TitleBar
            title={
              <>
                <CategoryIcon category={category} size={25} />
                <Heading style={styles.heading}>Remove {identifier}</Heading>
              </>
            }
            left={
              <Button
                title="Cancel"
                variant="transparent"
                icon={<Ionicons name="close-outline" size={16} />}
                onPress={onClose}
              />
            }
            right={
              <Button
                title={'Delete'}
                variant={'danger'}
                onPress={() => onRemoveDocument(doc)}
                isDisabled={docValue !== identifier}
              />
            }
          />
          <View style={styles.form}>
            <Text>
              This will delete resource {identifier} and all associated data
            </Text>
            <Text>
              Type <Text style={{ fontWeight: 'bold' }}>{identifier} </Text>to
              confirm
            </Text>
            <Input
              value={docValue}
              onChangeText={setDocValue}
              autoCapitalize="none"
              autoCompleteType="off"
              autoCorrect={false}
              autoFocus
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    marginTop: 200,
    alignItems: 'center',
  },
  heading: {
    marginLeft: 10,
  },
  card: {
    padding: 10,
    height: '30%',
    width: '70%',
    opacity: 0.9,
  },
  form: {
    padding: 10,
  },
});

export default DocumentRemoveModal;
