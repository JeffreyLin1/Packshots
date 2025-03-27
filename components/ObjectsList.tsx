import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type DetectedObject = {
  name: string;
  confidence: number;
};

type ObjectsListProps = {
  objects: DetectedObject[];
  onCreateList: (selectedItems: string[]) => void;
  listMode?: 'create' | 'update';
};

export default function ObjectsList({ objects, onCreateList, listMode = 'create' }: ObjectsListProps) {
  const [selectedObjects, setSelectedObjects] = useState<{ [key: string]: boolean }>(
    objects.reduce((acc, obj) => {
      acc[obj.name] = true;
      return acc;
    }, {} as { [key: string]: boolean })
  );

  const toggleSelection = (name: string) => {
    setSelectedObjects(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleCreateList = () => {
    const selectedItems = objects
      .filter(obj => selectedObjects[obj.name])
      .map(obj => obj.name);
    
    if (selectedItems.length === 0) {
      return;
    }
    
    onCreateList(selectedItems);
  };

  const getSelectedCount = () => {
    return objects.filter(obj => selectedObjects[obj.name]).length;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detected Items</Text>
      <Text style={styles.subtitle}>
        {objects.length} item{objects.length !== 1 ? 's' : ''} detected
      </Text>
      
      <FlatList
        data={objects}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemConfidence}>
                {Math.round(item.confidence * 100)}% confidence
              </Text>
            </View>
            <Switch
              value={selectedObjects[item.name]}
              onValueChange={() => toggleSelection(item.name)}
              trackColor={{ false: '#E8DBC5', true: '#D2B48C' }}
              thumbColor={selectedObjects[item.name] ? '#5D4FB7' : '#F5F5DC'}
            />
          </View>
        )}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
      
      <TouchableOpacity 
        style={styles.createButton}
        onPress={handleCreateList}
        disabled={getSelectedCount() === 0}
      >
        <Ionicons 
          name={listMode === 'create' ? "add-circle" : "save"} 
          size={24} 
          color="#FFFFFF" 
        />
        <Text style={styles.createButtonText}>
          {listMode === 'create' 
            ? `Create List (${getSelectedCount()})` 
            : `Add to List (${getSelectedCount()})`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A3C2C',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B7355',
    marginBottom: 20,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#FFF8E7',
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DBC5',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A3C2C',
  },
  itemConfidence: {
    fontSize: 14,
    color: '#8B7355',
    marginTop: 2,
  },
  createButton: {
    backgroundColor: '#5D4FB7',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginTop: 10,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
