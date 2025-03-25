import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type DetectedObject = {
  name: string;
  score: number;
};

type ObjectDetectionResultsProps = {
  objects: DetectedObject[];
  onClose: () => void;
  onSaveToList: (items: string[]) => void;
};

const ObjectDetectionResults: React.FC<ObjectDetectionResultsProps> = ({
  objects,
  onClose,
  onSaveToList
}) => {
  // Filter objects with a confidence score above 0.7 (70%)
  const highConfidenceObjects = objects
    .filter(obj => obj.score >= 0.7)
    .sort((a, b) => b.score - a.score);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Detected Items</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#4A3C2C" />
        </TouchableOpacity>
      </View>
      
      {highConfidenceObjects.length > 0 ? (
        <>
          <FlatList
            data={highConfidenceObjects}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.objectItem}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#5D4FB7" />
                <Text style={styles.objectName}>{item.name}</Text>
                <Text style={styles.objectScore}>{Math.round(item.score * 100)}%</Text>
              </View>
            )}
            style={styles.objectsList}
          />
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={() => onSaveToList(highConfidenceObjects.map(obj => obj.name))}
          >
            <Text style={styles.saveButtonText}>Save to Packing List</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color="#8B7355" />
          <Text style={styles.emptyText}>No items detected</Text>
          <Text style={styles.emptySubtext}>Try taking another photo with clearer items</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#E8DBC5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A3C2C',
  },
  closeButton: {
    padding: 8,
  },
  objectsList: {
    flex: 1,
    padding: 16,
  },
  objectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F4E3',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8DBC5',
  },
  objectName: {
    flex: 1,
    fontSize: 16,
    color: '#4A3C2C',
    marginLeft: 10,
  },
  objectScore: {
    fontSize: 14,
    color: '#5D4FB7',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#5D4FB7',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3C2C',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default ObjectDetectionResults;
