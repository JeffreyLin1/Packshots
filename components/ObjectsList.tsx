import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type DetectedObject = {
  name: string;
  confidence: number;
};

type ObjectsListProps = {
  objects: DetectedObject[];
  onCreateList?: (objects: string[]) => void;
};

const ObjectsList: React.FC<ObjectsListProps> = ({ objects, onCreateList }) => {
  const handleCreateList = () => {
    if (onCreateList) {
      const objectNames = objects.map(obj => obj.name);
      onCreateList(objectNames);
    }
  };

  const renderItem = ({ item }: { item: DetectedObject }) => (
    <View style={styles.objectItem}>
      <Ionicons name="checkmark-circle-outline" size={24} color="#5D4FB7" />
      <Text style={styles.objectName}>{item.name}</Text>
      <Text style={styles.objectConfidence}>
        {Math.round(item.confidence * 100)}%
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detected Items</Text>
      
      {objects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items detected</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={objects}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            style={styles.list}
          />
          
          <TouchableOpacity 
            style={styles.createListButton}
            onPress={handleCreateList}
          >
            <Ionicons name="list" size={20} color="#FFFFFF" />
            <Text style={styles.createListText}>Create Packing List</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A3C2C',
    marginBottom: 16,
  },
  list: {
    flex: 1,
  },
  objectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F4E3',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8DBC5',
  },
  objectName: {
    flex: 1,
    fontSize: 16,
    color: '#4A3C2C',
    marginLeft: 12,
  },
  objectConfidence: {
    fontSize: 14,
    color: '#8B7355',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
  },
  createListButton: {
    backgroundColor: '#5D4FB7',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  createListText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ObjectsList;
