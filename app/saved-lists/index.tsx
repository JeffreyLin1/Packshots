import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert
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

  // Load all saved lists on component mount
  useEffect(() => {
    loadSavedLists();
  }, []);

  // Load lists from AsyncStorage
  const loadSavedLists = async () => {
    setIsLoading(true);
    try {
      const savedListsJson = await AsyncStorage.getItem('packingLists');
      if (savedListsJson) {
        const savedLists = JSON.parse(savedListsJson) as PackingList[];
        // Sort by most recent first
        savedLists.sort((a, b) => b.createdAt - a.createdAt);
        setLists(savedLists);
      } else {
        setLists([]);
      }
    } catch (error) {
      console.error('Failed to load lists:', error);
      Alert.alert('Error', 'Failed to load your saved lists.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing list
  const updateList = async (listData: Omit<PackingList, 'id' | 'createdAt'>) => {
    if (!selectedList) return;
    
    try {
      // Create updated list object
      const updatedList: PackingList = {
        ...selectedList,
        title: listData.title,
        items: listData.items,
        icon: listData.icon,
      };
      
      // Get existing lists
      const existingListsJson = await AsyncStorage.getItem('packingLists');
      if (!existingListsJson) return;
      
      const existingLists: PackingList[] = JSON.parse(existingListsJson);
      
      // Find and update the list
      const updatedLists = existingLists.map(list => 
        list.id === updatedList.id ? updatedList : list
      );
      
      // Save back to storage
      await AsyncStorage.setItem('packingLists', JSON.stringify(updatedLists));
      
      // Update state
      setLists(updatedLists);
      
      // Close modal
      setIsEditModalVisible(false);
      setSelectedList(null);
      
      Alert.alert('Success', 'List updated successfully!');
    } catch (error) {
      console.error('Failed to update list:', error);
      Alert.alert('Error', 'Failed to update the list. Please try again.');
    }
  };

  // Delete a list
  const deleteList = async (listId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this list? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get existing lists
              const existingListsJson = await AsyncStorage.getItem('packingLists');
              if (!existingListsJson) return;
              
              const existingLists: PackingList[] = JSON.parse(existingListsJson);
              
              // Filter out the list to delete
              const updatedLists = existingLists.filter(list => list.id !== listId);
              
              // Save back to storage
              await AsyncStorage.setItem('packingLists', JSON.stringify(updatedLists));
              
              // Update state
              setLists(updatedLists);
              
              Alert.alert('Success', 'List deleted successfully!');
            } catch (error) {
              console.error('Failed to delete list:', error);
              Alert.alert('Error', 'Failed to delete the list. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Open edit modal for a list
  const openEditModal = (list: PackingList) => {
    setSelectedList(list);
    setIsEditModalVisible(true);
  };

  // View a list
  const viewList = (list: PackingList) => {
    router.push({
      pathname: '/list-details/[id]',
      params: { id: list.id }
    });
  };

  // Navigate to home screen
  const goToHome = () => {
    router.push('/');
  };

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Lists</Text>
      </View>
      
      {lists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="list-outline" size={48} color="#8B7355" />
          <Text style={styles.emptyText}>No saved lists yet</Text>
          <Text style={styles.emptySubtext}>Create a list to get started</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={goToHome}
          >
            <Text style={styles.createButtonText}>Create a List</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.listCard}>
              <View style={styles.listHeader}>
                <View style={styles.listTitleContainer}>
                  <View style={styles.listIconContainer}>
                    <Ionicons name={item.icon || "list"} size={20} color="#5D4FB7" />
                  </View>
                  <Text style={styles.listTitle}>{item.title}</Text>
                </View>
                <View style={styles.listActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => openEditModal(item)}
                  >
                    <Ionicons name="create-outline" size={20} color="#5D4FB7" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => deleteList(item.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.listDetails}>
                <Text style={styles.listSubtitle}>{item.items.length} items</Text>
                <Text style={styles.listDate}>{formatDate(item.createdAt)}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.viewButton}
                onPress={() => viewList(item)}
              >
                <Text style={styles.viewButtonText}>View List</Text>
                <Ionicons name="chevron-forward" size={16} color="#5D4FB7" />
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Edit List Modal */}
      {selectedList && (
        <ListModal
          isVisible={isEditModalVisible}
          onClose={() => {
            setIsEditModalVisible(false);
            setSelectedList(null);
          }}
          onSave={updateList}
          initialData={{
            title: selectedList.title,
            items: selectedList.items,
            icon: selectedList.icon
          }}
          mode="edit"
        />
      )}
      
      <TabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#E8DBC5',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A3C2C',
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
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#5D4FB7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
  },
  listCard: {
    backgroundColor: '#F8F4E3',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E8DBC5',
    overflow: 'hidden',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingBottom: 10,
  },
  listTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3C2C',
  },
  listActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  listDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 12,
  },
  listSubtitle: {
    fontSize: 14,
    color: '#8B7355',
  },
  listDate: {
    fontSize: 12,
    color: '#8B7355',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8DBC5',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D4FB7',
    marginRight: 4,
  },
});
