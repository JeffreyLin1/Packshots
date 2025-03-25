import { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import ListModal, { PackingList } from '../components/ListModal';
import TabBar from '../components/TabBar';
import { useAuth } from '../lib/AuthContext';

export default function App() {
  // Animation states for mascot text
  const fullText = "Hi! I'm Packie";
  const [animatedText, setAnimatedText] = useState('');
  
  // State for lists and modal
  const [recentLists, setRecentLists] = useState<PackingList[]>([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  
  // Load saved lists on component mount
  useEffect(() => {
    loadSavedLists();
  }, []);
  
  // Animation effect
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setAnimatedText(fullText.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  // Load lists from AsyncStorage
  const loadSavedLists = async () => {
    try {
      const savedListsJson = await AsyncStorage.getItem('packingLists');
      if (savedListsJson) {
        const savedLists = JSON.parse(savedListsJson) as PackingList[];
        // Sort by most recent first
        savedLists.sort((a, b) => b.createdAt - a.createdAt);
        setRecentLists(savedLists);
      }
    } catch (error) {
      console.error('Failed to load lists:', error);
      Alert.alert('Error', 'Failed to load your saved lists.');
    }
  };
  
  // Save a new list
  const saveNewList = async (listData: Omit<PackingList, 'id' | 'createdAt'>) => {
    try {
      // Create new list object
      const newList: PackingList = {
        id: Math.random().toString(36).substring(2, 9),
        title: listData.title,
        items: listData.items,
        icon: listData.icon,
        createdAt: Date.now()
      };
      
      // Get existing lists or initialize empty array
      const existingListsJson = await AsyncStorage.getItem('packingLists');
      const existingLists: PackingList[] = existingListsJson 
        ? JSON.parse(existingListsJson) 
        : [];
      
      // Add new list and save back to storage
      const updatedLists = [newList, ...existingLists];
      await AsyncStorage.setItem('packingLists', JSON.stringify(updatedLists));
      
      // Update state
      setRecentLists(updatedLists);
      
      // Close modal
      setIsCreateModalVisible(false);
      
      Alert.alert('Success', 'Your list has been saved!');
    } catch (error) {
      console.error('Failed to save list:', error);
      Alert.alert('Error', 'Failed to save your list. Please try again.');
    }
  };

  // Navigate to saved lists screen
  const goToSavedLists = () => {
    router.push('/saved-lists');
  };

  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Packie</Text>
        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person-outline" size={24} color="#4A3C2C" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.contentContainer}>
          <View style={styles.heroSection}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>Ready to go?</Text>
              <Text style={styles.heroSubtitle}>Let's make sure you have everything!</Text>
            </View>
            <Image 
              source={require('../assets/images/packie1.svg')} 
              style={styles.mascotImage}
              resizeMode="contain"
            />
          </View>
          
          <Text style={styles.sectionTitle}>Check your items</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => router.replace('/camera')}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="camera" size={28} color="#5D4FB7" />
              </View>
              <Text style={styles.optionLabel}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => router.push('/check-list')}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="checklist" size={28} color="#5D4FB7" />
              </View>
              <Text style={styles.optionLabel}>Manual Check</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.sectionTitle, {marginTop: 25}]}>Manage your lists</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => setIsCreateModalVisible(true)}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="add" size={28} color="#5D4FB7" />
              </View>
              <Text style={styles.optionLabel}>Custom List</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionCard}
              onPress={goToSavedLists}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="bookmark-outline" size={28} color="#5D4FB7" />
              </View>
              <Text style={styles.optionLabel}>Saved Lists</Text>
            </TouchableOpacity>
          </View>

          {!user && (
            <TouchableOpacity 
              style={styles.signInButton}
              onPress={() => router.push('/auth/sign-in')}
            >
              <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      
      {/* List Modal Component */}
      <ListModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSave={saveNewList}
      />
      
      {/* Use the TabBar component */}
      <TabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC', // Beige background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#E8DBC5', // Slightly darker beige for header
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A3C2C', // Warm brown color
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F4E3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  heroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A3C2C',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6B5B45',
  },
  mascotImage: {
    width: 100,
    height: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#4A3C2C',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionCard: {
    width: '48%',
    borderRadius: 12,
    backgroundColor: '#F8F4E3',
    padding: 15,
    borderWidth: 1,
    borderColor: '#E8DBC5',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0EAD6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A3C2C',
    textAlign: 'center',
  },
  recentSection: {
    marginTop: 25,
    marginBottom: 30,
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
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 5,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D4FB7',
    marginRight: 8,
  },
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#F8F4E3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DBC5',
  },
  emptyListText: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    marginTop: 10,
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
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    color: '#4A3C2C',
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: '#5D4FB7',
    marginTop: -1,
  },
  activeTabLabel: {
    color: '#5D4FB7',
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: '#5D4FB7',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    marginTop: 10,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
