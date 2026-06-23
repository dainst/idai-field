import { Ionicons } from '@expo/vector-icons';
import { Document } from 'idai-field-core';
import React, { useContext, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ConfigurationContext } from '@/contexts/configuration-context';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import CategoryIcon from '@/components/common/CategoryIcon';
import Heading from '@/components/common/Heading';
import Input from '@/components/common/Input';
import TitleBar from '@/components/common/TitleBar';

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
      <Pressable
        onPress={onClose}
        style={styles.container}
        testID="documentRemoveModalBackdrop"
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={styles.cardShell}
        >
          <Card style={styles.card}>
          <TitleBar
            title={
              <>
                <CategoryIcon category={category} size={25} />
                <Heading style={styles.heading}>{identifier} 삭제</Heading>
              </>
            }
            left={
              <Button
                title="취소"
                variant="transparent"
                icon={<Ionicons name="close-outline" size={16} />}
                onPress={onClose}
              />
            }
            right={
              <Button
                title="삭제"
                variant={'danger'}
                onPress={() => onRemoveDocument(doc)}
                isDisabled={docValue !== identifier}
              />
            }
          />
          <View style={styles.form}>
            <Text>
              {identifier} 기록과 연결된 모든 데이터를 삭제합니다.
            </Text>
            <Text>
              삭제하려면 <Text style={{ fontWeight: 'bold' }}>{identifier}</Text>를 정확히 입력하세요.
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
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.42)',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
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
  cardShell: {
    alignItems: 'center',
    width: '100%',
  },
  form: {
    padding: 10,
  },
});

export default DocumentRemoveModal;
