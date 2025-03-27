import { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
  FlatList
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import ListModal, { PackingList } from '../components/ListModal';
import TabBar from '../components/TabBar';
import { useAuth } from '../lib/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

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
      
      // Navigate to the new list details
      router.push({
        pathname: '/list-details/[id]',
        params: { id: newList.id }
      });
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

  // When navigating to a list from the home screen
  const viewList = (list: PackingList) => {
    router.push({
      pathname: '/list-details/[id]',
      params: { id: list.id }
    });
  };

  // Render a recent list item
  const renderRecentList = ({ item }: { item: PackingList }) => {
    // Calculate how many items are packed
    const packedCount = item.items.filter(i => 
      typeof i === 'object' && i.packed
    ).length;
    
    // Calculate progress percentage
    const progress = item.items.length > 0 
      ? Math.round((packedCount / item.items.length) * 100) 
      : 0;
    
    return (
      <TouchableOpacity 
        style={styles.recentListCard}
        onPress={() => viewList(item)}
      >
        <View style={styles.recentListIconContainer}>
          <Ionicons 
            name={item.icon as any || "list-outline"} 
            size={24} 
            color="#8B7355" 
          />
        </View>
        <View style={styles.recentListInfo}>
          <Text style={styles.recentListTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.recentListSubtitle}>
            {item.items.length} items • {progress}% packed
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#8B7355" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentContainer}>
          <View style={styles.heroSection}>
            <LinearGradient
              colors={['#D2B48C', '#C8A982', '#B89F7A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroSubtitle}>Let's take some</Text>
                <Text style={styles.heroTitle}>PACKSHOTS!</Text>
              </View>
              <Image 
                source={require('../assets/images/packie1.svg')} 
                style={styles.mascotImage}
                resizeMode="contain"
              />
            </LinearGradient>
          </View>
          
          <Text style={styles.sectionTitle}>Get Started</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={[styles.optionCard, styles.largeCard]}
              onPress={goToSavedLists}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="bookmark-outline" size={28} color="#8B7355" />
              </View>
              <Text style={styles.optionLabel}>My Lists</Text>
              <Text style={styles.optionDescription}>View and select from your saved packing lists</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={[styles.optionCard, styles.largeCard]}
              onPress={() => setIsCreateModalVisible(true)}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="add" size={28} color="#8B7355" />
              </View>
              <Text style={styles.optionLabel}>Create New List</Text>
              <Text style={styles.optionDescription}>Build a custom packing list from scratch</Text>
            </TouchableOpacity>
          </View>
          
          {/* Recently Opened Lists Section */}
          {recentLists.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, {marginTop: 20}]}>Recently Used</Text>
              <View style={styles.recentListsContainer}>
                {recentLists.slice(0, 3).map(list => (
                  <TouchableOpacity 
                    key={list.id}
                    style={styles.recentListCard}
                    onPress={() => viewList(list)}
                  >
                    <View style={styles.recentListIconContainer}>
                      <Ionicons 
                        name={list.icon as any || "list-outline"} 
                        size={24} 
                        color="#8B7355" 
                      />
                    </View>
                    <View style={styles.recentListInfo}>
                      <Text style={styles.recentListTitle} numberOfLines={1}>
                        {list.title}
                      </Text>
                      <Text style={styles.recentListSubtitle}>
                        {list.items.length} items
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#8B7355" />
                  </TouchableOpacity>
                ))}
                
                {recentLists.length > 3 && (
                  <TouchableOpacity 
                    style={styles.viewAllButton}
                    onPress={goToSavedLists}
                  >
                    <Text style={styles.viewAllText}>View All Lists</Text>
                    <Ionicons name="arrow-forward" size={16} color="#5D4FB7" />
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

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
    backgroundColor: '#F5F5DC', // Light beige background
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  contentContainer: {
    padding: 20,
  },
  heroSection: {
    marginBottom: 30,
  },
  heroCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#8B7355',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#FFF8E7',
  },
  mascotImage: {
    width: 120,
    height: 120,
    transform: [{ translateY: -10 }], // Slight lift for 3D effect
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#4A3C2C',
  },
  optionsRow: {
    marginBottom: 15,
  },
  optionCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#FFF8E7',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#8B7355',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  largeCard: {
    height: 160,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0EAD6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#8B7355',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  signInButton: {
    marginTop: 30,
    backgroundColor: '#8B7355',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#8B7355',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // New styles for recently opened lists
  recentListsContainer: {
    marginBottom: 15,
  },
  recentListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#8B7355',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  recentListIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0EAD6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentListInfo: {
    flex: 1,
  },
  recentListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A3C2C',
  },
  recentListSubtitle: {
    fontSize: 14,
    color: '#8B7355',
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 5,
  },
  viewAllText: {
    fontSize: 16,
    color: '#5D4FB7',
    fontWeight: '600',
    marginRight: 5,
  },
});
