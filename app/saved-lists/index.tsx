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
      
      // Update the list in the array
      const updatedLists = lists.map(list => 
        list.id === selectedList.id ? updatedList : list
      );
      
      // Save back to storage
      await AsyncStorage.setItem('packingLists', JSON.stringify(updatedLists));
      
      // Update state
      setLists(updatedLists);
      setSelectedList(null);
      setIsEditModalVisible(false);
      
      Alert.alert('Success', 'Your list has been updated!');
    } catch (error) {
      console.error('Failed to update list:', error);
      Alert.alert('Error', 'Failed to update your list. Please try again.');
    }
  };

  // Delete a list
  const deleteList = async (id: string) => {
    Alert.alert(
      'Delete List',
      'Are you sure you want to delete this list?',
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
              const updatedLists = lists.filter(list => list.id !== id);
              await AsyncStorage.setItem('packingLists', JSON.stringify(updatedLists));
              setLists(updatedLists);
              Alert.alert('Success', 'List deleted successfully');
            } catch (error) {
              console.error('Failed to delete list:', error);
              Alert.alert('Error', 'Failed to delete the list. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Edit a list
  const editList = (list: PackingList) => {
    setSelectedList(list);
    setIsEditModalVisible(true);
  };

  // Navigate to home screen
  const goToHome = () => {
    router.push('/');
  };

  // Render each list item
  const renderListItem = ({ item }: { item: PackingList }) => {
    // Calculate packing progress
    const packedItems = item.items.filter(i => i.packed).length;
    const totalItems = item.items.length;
    const progress = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;
    
    return (
      <View style={styles.listCard}>
        <View style={styles.listHeader}>
          <View style={styles.listTitleContainer}>
            <View style={styles.listIconContainer}>
              <Ionicons name={item.icon as any} size={24} color="#5D4FB7" />
            </View>
            <Text style={styles.listTitle}>{item.title}</Text>
          </View>
          <View style={styles.listActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => editList(item)}
            >
              <Ionicons name="pencil-outline" size={20} color="#5D4FB7" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => deleteList(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#E57373" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.listDetails}>
          <Text style={styles.listSubtitle}>
            {totalItems} items • {progress}% packed
          </Text>
          <Text style={styles.listDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View List</Text>
          <Ionicons name="chevron-forward" size={16} color="#5D4FB7" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Lists</Text>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading your lists...</Text>
        </View>
      ) : (
        <>
          {lists.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="list-outline" size={60} color="#8B7355" />
              <Text style={styles.emptyText}>No saved lists yet</Text>
              <Text style={styles.emptySubtext}>
                Create a new list from the home screen
              </Text>
            </View>
          ) : (
            <FlatList
              data={lists}
              renderItem={renderListItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </>
      )}
      
      {/* Edit List Modal */}
      <ListModal
        visible={isEditModalVisible}
        onClose={() => {
          setIsEditModalVisible(false);
          setSelectedList(null);
        }}
        onSave={updateList}
        initialList={selectedList || undefined}
      />
      
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={goToHome}
        >
          <Ionicons name="home-outline" size={24} color="#8B7355" />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.tabItem, styles.activeTab]}>
          <Ionicons name="bookmark" size={24} color="#5D4FB7" />
          <Text style={[styles.tabLabel, styles.activeTabLabel]}>Saved Lists</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#8B7355" />
          <Text style={styles.tabLabel}>Check</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="person-outline" size={24} color="#8B7355" />
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DBC5',
    backgroundColor: '#F8F4E3',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A3C2C',
  },
  loadingContainer: {
    flex: 1,
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
  listContainer: {
    padding: 16,
  },
  listCard: {
    backgroundColor: '#F8F4E3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8DBC5',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
    marginBottom: 12,
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
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8DBC5',
    marginTop: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D4FB7',
    marginRight: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E8DBC5',
    paddingVertical: 10,
    backgroundColor: '#F8F4E3',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: '#5D4FB7',
    marginTop: -1,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    color: '#8B7355',
  },
  activeTabLabel: {
    color: '#5D4FB7',
    fontWeight: '600',
  },
});
