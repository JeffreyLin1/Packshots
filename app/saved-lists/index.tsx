import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import ListModal, { PackingList } from '../../components/ListModal';
import TabBar from '../../components/TabBar';

export default function SavedListsScreen() {
  const [lists, setLists] = useState<PackingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedList, setSelectedList] = useState<PackingList | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    setIsLoading(true);
    try {
      const savedListsJson = await AsyncStorage.getItem('packingLists');
      if (savedListsJson) {
        const savedLists = JSON.parse(savedListsJson) as PackingList[];
        setLists(savedLists);
      }
    } catch (error) {
      console.error('Failed to load lists:', error);
      Alert.alert('Error', 'Failed to load your saved lists.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateList = async (newList: PackingList) => {
    try {
      const updatedLists = [...lists, newList];
      await AsyncStorage.setItem('packingLists', JSON.stringify(updatedLists));
      setLists(updatedLists);
      setIsCreateModalVisible(false);
    } catch (error) {
      console.error('Failed to save new list:', error);
      Alert.alert('Error', 'Failed to save your new list.');
    }
  };

  const handleDeleteList = async (listId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedLists = lists.filter(list => list.id !== listId);
              await AsyncStorage.setItem('packingLists', JSON.stringify(updatedLists));
              setLists(updatedLists);
            } catch (error) {
              console.error('Failed to delete list:', error);
              Alert.alert('Error', 'Failed to delete the list.');
            }
          }
        }
      ]
    );
  };

  const navigateToList = (listId: string) => {
    router.push(`/list-details/${listId}`);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5D4FB7" />
          <Text style={styles.loadingText}>Loading your lists...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Lists</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setIsCreateModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {lists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="list-outline" size={64} color="#8B7355" />
          <Text style={styles.emptyText}>You don't have any lists yet.</Text>
          <TouchableOpacity 
            style={styles.createFirstButton}
            onPress={() => setIsCreateModalVisible(true)}
          >
            <Text style={styles.createFirstButtonText}>Create Your First List</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listViewContainer}>
          <View style={styles.catImageContainer}>
            <Image 
              source={require('../../assets/images/thinking_cat_transparent.png')} 
              style={styles.catImage}
              resizeMode="contain"
            />
          </View>
          
          <FlatList
            data={lists}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.listCard}
                onPress={() => navigateToList(item.id)}
              >
                <View style={styles.listIconContainer}>
                  <Ionicons 
                    name={item.icon as any || "list-outline"} 
                    size={24} 
                    color="#8B7355" 
                  />
                </View>
                <View style={styles.listContent}>
                  <Text style={styles.listTitle}>{item.title}</Text>
                  <Text style={styles.listSubtitle}>
                    {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteList(item.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#E57373" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContainer}
          />
        </View>
      )}
      
      <ListModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSave={handleCreateList}
        initialList={null}
      />
      
      <TabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4E3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DBC5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A3C2C',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5D4FB7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#8B7355',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  createFirstButton: {
    backgroundColor: '#5D4FB7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  createFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0EAD6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A3C2C',
  },
  listSubtitle: {
    fontSize: 14,
    color: '#8B7355',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8B7355',
    marginTop: 12,
  },
  listViewContainer: {
    flex: 1,
    position: 'relative',
  },
  catImageContainer: {
    position: 'absolute',
    bottom: 10,
    right: -40,
    zIndex: -1,
  },
  catImage: {
    width: 350,
    height: 350,
  },
});
