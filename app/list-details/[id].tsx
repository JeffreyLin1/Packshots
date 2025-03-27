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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { PackingList } from '../../components/ListModal';
import TabBar from '../../components/TabBar';
import { useAuth } from '../../lib/AuthContext';

export default function ListDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [list, setList] = useState<PackingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadList();
  }, [id]);

  const loadList = async () => {
    setIsLoading(true);
    try {
      const savedListsJson = await AsyncStorage.getItem('packingLists');
      if (savedListsJson) {
        const savedLists = JSON.parse(savedListsJson) as PackingList[];
        const foundList = savedLists.find(list => list.id === id);
        if (foundList) {
          setList(foundList);
        } else {
          Alert.alert('Error', 'List not found');
          router.back();
        }
      } else {
        Alert.alert('Error', 'No lists found');
        router.back();
      }
    } catch (error) {
      console.error('Failed to load list:', error);
      Alert.alert('Error', 'Failed to load the list');
    } finally {
      setIsLoading(false);
    }
  };

  const goToCamera = () => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'You need to sign in to use the camera feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Sign In', 
            onPress: () => router.push('/auth/sign-in')
          }
        ]
      );
      return;
    }
    
    router.push({
      pathname: '/camera',
      params: { listId: id }
    });
  };

  const goToManualCheck = () => {
    router.push({
      pathname: '/check-list/[id]',
      params: { id }
    });
  };

  const goToVoiceCheck = () => {
    // This would be implemented in the future
    Alert.alert('Coming Soon', 'Voice check feature is coming soon!');
  };

  const goBack = () => {
    router.back();
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
          <Text style={styles.errorText}>List not found</Text>
          <TouchableOpacity onPress={goBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4A3C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{list.title}</Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.listInfoCard}>
          <Text style={styles.listTitle}>{list.title}</Text>
          <Text style={styles.itemCount}>
            {list.items.length} item{list.items.length !== 1 ? 's' : ''}
          </Text>
          
          <FlatList
            data={list.items.slice(0, 5)} // Show only first 5 items
            keyExtractor={(item) => typeof item === 'string' ? item : item.id}
            renderItem={({ item }) => (
              <View style={styles.itemPreview}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#8B7355" />
                <Text style={styles.itemPreviewText}>
                  {typeof item === 'string' ? item : item.name}
                </Text>
              </View>
            )}
            ListFooterComponent={
              list.items.length > 5 ? (
                <Text style={styles.moreItemsText}>
                  +{list.items.length - 5} more items
                </Text>
              ) : null
            }
          />
        </View>
        
        <Text style={styles.sectionTitle}>Choose a check method</Text>
        
        <View style={styles.checkMethodsContainer}>
          <TouchableOpacity 
            style={styles.checkMethodCard}
            onPress={goToCamera}
          >
            <View style={styles.methodIconContainer}>
              <Ionicons name="camera" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Camera Check</Text>
              <Text style={styles.methodDescription}>
                Take a photo of your items
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.checkMethodCard}
            onPress={goToManualCheck}
          >
            <View style={styles.methodIconContainer}>
              <MaterialIcons name="checklist" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Manual Check</Text>
              <Text style={styles.methodDescription}>
                Check items off manually
              </Text>
            </View>
          </TouchableOpacity>
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DBC5',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3C2C',
  },
  placeholder: {
    width: 30,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#4A3C2C',
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
    marginTop: 10,
    marginBottom: 20,
  },
  backButtonText: {
    color: '#5D4FB7',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listInfoCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#E8DBC5',
  },
  listTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4A3C2C',
    marginBottom: 5,
  },
  itemCount: {
    fontSize: 16,
    color: '#8B7355',
    marginBottom: 15,
  },
  itemPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemPreviewText: {
    fontSize: 16,
    color: '#4A3C2C',
    marginLeft: 10,
  },
  moreItemsText: {
    fontSize: 14,
    color: '#8B7355',
    marginTop: 5,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3C2C',
    marginBottom: 15,
  },
  checkMethodsContainer: {
    gap: 15,
  },
  checkMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E8DBC5',
  },
  methodInfo: {
    flex: 1,
  },
  methodIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D2B48C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A3C2C',
  },
  methodDescription: {
    fontSize: 14,
    color: '#8B7355',
  },
});
