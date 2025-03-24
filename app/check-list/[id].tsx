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
import { router, useLocalSearchParams } from 'expo-router';
import { PackingList, ListItem } from '../../components/ListModal';

export default function CheckListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [list, setList] = useState<PackingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // Load list data on component mount
  useEffect(() => {
    if (id) {
      loadList(id);
    }
  }, [id]);

  // Calculate progress whenever items change
  useEffect(() => {
    if (list && list.items.length > 0) {
      const packedCount = list.items.filter(item => item.packed).length;
      setProgress(Math.round((packedCount / list.items.length) * 100));
    } else {
      setProgress(0);
    }
  }, [list]);

  // Load list from AsyncStorage
  const loadList = async (listId: string) => {
    setIsLoading(true);
    try {
      const savedListsJson = await AsyncStorage.getItem('packingLists');
      if (savedListsJson) {
        const savedLists = JSON.parse(savedListsJson) as PackingList[];
        const foundList = savedLists.find(list => list.id === listId);
        
        if (foundList) {
          setList(foundList);
        } else {
          Alert.alert('Error', 'List not found');
          goBack();
        }
      } else {
        Alert.alert('Error', 'No lists found');
        goBack();
      }
    } catch (error) {
      console.error('Failed to load list:', error);
      Alert.alert('Error', 'Failed to load your list.');
      goBack();
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle item packed status
  const toggleItemPacked = async (itemId: string) => {
    if (!list) return;
    
    try {
      // Update the item in the current list
      const updatedItems = list.items.map(item => 
        item.id === itemId ? { ...item, packed: !item.packed } : item
      );
      
      const updatedList = {
        ...list,
        items: updatedItems
      };
      
      // Update the list in storage
      const savedListsJson = await AsyncStorage.getItem('packingLists');
      if (savedListsJson) {
        const savedLists = JSON.parse(savedListsJson) as PackingList[];
        const updatedLists = savedLists.map(l => 
          l.id === list.id ? updatedList : l
        );
        
        await AsyncStorage.setItem('packingLists', JSON.stringify(updatedLists));
        setList(updatedList);
      }
    } catch (error) {
      console.error('Failed to update item:', error);
      Alert.alert('Error', 'Failed to update item status.');
    }
  };

  // Go back to manual check screen
  const goBack = () => {
    router.back();
  };

  // Navigate to home screen
  const goToHome = () => {
    router.push('/');
  };

  // Navigate to saved lists screen
  const goToSavedLists = () => {
    router.push('/saved-lists');
  };

  // Navigate to manual check screen
  const goToManualCheck = () => {
    router.push('/check-list');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5D4FB7" />
          <Text style={styles.loadingText}>Loading your list...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!list) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#8B7355" />
          <Text style={styles.errorText}>List not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#4A3C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{list.title}</Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{progress}% Packed</Text>
        </View>
        
        <FlatList
          data={list.items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.itemCard}
              onPress={() => toggleItemPacked(item.id)}
            >
              <View style={[
                styles.checkbox, 
                item.packed && styles.checkboxChecked
              ]}>
                {item.packed && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={[
                styles.itemText,
                item.packed && styles.itemTextChecked
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
        />
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
          onPress={goToManualCheck}
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
    justifyContent: 'space-between',
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
  },
  placeholder: {
    width: 40,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E8DBC5',
    borderRadius: 5,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5D4FB7',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    color: '#4A3C2C',
    textAlign: 'right',
  },
  listContainer: {
    paddingBottom: 20,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8F4E3',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8DBC5',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#5D4FB7',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#5D4FB7',
  },
  itemText: {
    fontSize: 16,
    color: '#4A3C2C',
  },
  itemTextChecked: {
    textDecorationLine: 'line-through',
    color: '#8B7355',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3C2C',
    marginTop: 20,
    marginBottom: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
