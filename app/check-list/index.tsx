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
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { PackingList } from '../../components/ListModal';
import TabBar from '../../components/TabBar';

export default function CheckListSelectionScreen() {
  const [lists, setLists] = useState<PackingList[]>([]);
  const [filteredLists, setFilteredLists] = useState<PackingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load all saved lists on component mount
  useEffect(() => {
    loadSavedLists();
  }, []);

  // Filter lists when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredLists(lists);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = lists.filter(list => 
        list.title.toLowerCase().includes(query) || 
        list.items.some(item => 
          typeof item === 'string' 
            ? item.toLowerCase().includes(query)
            : item.name?.toLowerCase().includes(query)
        )
      );
      setFilteredLists(filtered);
    }
  }, [searchQuery, lists]);

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
        setFilteredLists(savedLists);
      } else {
        setLists([]);
        setFilteredLists([]);
      }
    } catch (error) {
      console.error('Failed to load lists:', error);
      Alert.alert('Error', 'Failed to load your saved lists.');
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to check list screen
  const goToCheckList = (list: PackingList) => {
    router.push({
      pathname: '/check-list/[id]',
      params: { id: list.id }
    });
  };

  // Navigate to home screen
  const goToHome = () => {
    router.push('/');
  };

  // Clear search query
  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8B7355" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search lists..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#8B7355"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="#8B7355" />
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5D4FB7" />
            <Text style={styles.loadingText}>Loading your lists...</Text>
          </View>
        ) : lists.length === 0 ? (
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
        ) : filteredLists.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#8B7355" />
            <Text style={styles.emptyText}>No matching lists</Text>
            <Text style={styles.emptySubtext}>Try a different search term</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={clearSearch}
            >
              <Text style={styles.createButtonText}>Clear Search</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredLists}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.listCard}
                onPress={() => goToCheckList(item)}
              >
                <View style={styles.listIconContainer}>
                  <Ionicons name={item.icon || "list"} size={20} color="#5D4FB7" />
                </View>
                <View style={styles.listContent}>
                  <Text style={styles.listTitle}>{item.title}</Text>
                  <Text style={styles.listSubtitle}>{item.items.length} items</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8B7355" />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      
      <TabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8DBC5',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: '#4A3C2C',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#8B7355',
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
    paddingBottom: 20,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8F4E3',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E8DBC5',
  },
  listIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0EAD6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
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
    marginTop: 4,
  },
});
