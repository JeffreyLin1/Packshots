import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { PackingList } from '../../components/ListModal';

export default function CheckListSelectionScreen() {
  const [lists, setLists] = useState<PackingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Navigate to home screen
  const goToHome = () => {
    router.push('/');
  };

  // Navigate to saved lists screen
  const goToSavedLists = () => {
    router.push('/saved-lists');
  };

  // Navigate to check list screen
  const goToCheckList = (list: PackingList) => {
    router.push({
      pathname: '/check-list/[id]',
      params: { id: list.id }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manual Check</Text>
        <TouchableOpacity style={styles.backButton} onPress={goToHome}>
          <Ionicons name="arrow-back" size={24} color="#4A3C2C" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.subtitle}>Select a list to check</Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5D4FB7" />
            <Text style={styles.loadingText}>Loading your lists...</Text>
          </View>
        ) : lists.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="list-outline" size={48} color="#8B7355" />
            <Text style={styles.emptyText}>You don't have any lists yet</Text>
            <Text style={styles.emptySubtext}>Create a list first to use the manual check feature</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={goToHome}
            >
              <Text style={styles.createButtonText}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={lists}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.listCard}
                onPress={() => goToCheckList(item)}
              >
                <View style={styles.listIconContainer}>
                  <Ionicons name={item.icon as any} size={24} color="#5D4FB7" />
                </View>
                <View style={styles.listContent}>
                  <Text style={styles.listTitle}>{item.title}</Text>
                  <Text style={styles.listSubtitle}>
                    {item.items.length} items • {item.items.filter(i => i.packed).length} packed
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8B7355" />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
      
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={goToHome}
        >
          <Ionicons name="home-outline" size={24} color="#8B7355" />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={goToSavedLists}
        >
          <Ionicons name="bookmark-outline" size={24} color="#8B7355" />
          <Text style={styles.tabLabel}>Saved Lists</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabItem, styles.activeTab]}
        >
          <Ionicons name="checkmark-circle" size={24} color="#5D4FB7" />
          <Text style={[styles.tabLabel, styles.activeTabLabel]}>Check</Text>
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
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#E8DBC5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A3C2C',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F4E3',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 20,
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A3C2C',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8B7355',
    marginTop: 10,
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
