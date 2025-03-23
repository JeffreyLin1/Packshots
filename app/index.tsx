import { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Link } from 'expo-router';

export default function App() {
  const { user, signOut } = useAuth();
  
  // Animation states for mascot text
  const fullText = "Hi! I'm Packie";
  const [animatedText, setAnimatedText] = useState('');
  
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setAnimatedText(fullText.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 100); // Speed of animation (milliseconds per character)
    
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Packie</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Start packing</Text>
          <Text style={styles.subtitle}>Choose an activity or create your own list.</Text>
          
          <View style={styles.activitiesGrid}>
            <View style={styles.row}>
              <TouchableOpacity style={styles.activityCard}>
                <Text style={styles.activityLabel}>Weekend trip</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.activityCard}>
                <Text style={styles.activityLabel}>Workout</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.row}>
              <TouchableOpacity style={styles.activityCard}>
                <Text style={styles.activityLabel}>Beach day</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.activityCard}>
                <Text style={styles.activityLabel}>Camping</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity style={styles.listItem}>
            <View style={styles.listItemIcon}>
              <Text>🔖</Text>
            </View>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>Saved Lists</Text>
              <Text style={styles.listItemSubtitle}>2 items</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.listItem}>
            <View style={styles.listItemIcon}>
              <Text>💡</Text>
            </View>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>Packie's Tips</Text>
              <Text style={styles.listItemSubtitle}>for the best beach day</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Text>🏠</Text>
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Text>🎯</Text>
          <Text style={styles.tabLabel}>Activities</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Text>💡</Text>
          <Text style={styles.tabLabel}>Tips</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Text>⚙️</Text>
          <Text style={styles.tabLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC', // Beige background to match auth screens
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    position: 'relative',
    backgroundColor: '#E8DBC5', // Slightly darker beige for header
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A3C2C', // Warm brown color to match theme
  },
  settingsButton: {
    position: 'absolute',
    right: 20,
  },
  settingsIcon: {
    fontSize: 24,
    color: '#4A3C2C',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#4A3C2C', // Warm brown color
  },
  subtitle: {
    fontSize: 16,
    color: '#6B5B45', // Slightly lighter brown
    marginBottom: 24,
  },
  activitiesGrid: {
    marginBottom: 30,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  activityCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8F4E3', // Light beige for cards
    padding: 15,
    borderWidth: 1,
    borderColor: '#E8DBC5',
    height: 120, // Fixed height for cards
    justifyContent: 'flex-end', // Place text at bottom
  },
  activityImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 8,
    color: '#4A3C2C',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DBC5', // Slightly darker beige
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F4E3', // Light beige
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A3C2C', // Warm brown
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#8B7355', // Tan color
    marginTop: 4,
  },
  chevron: {
    fontSize: 24,
    color: '#8B7355', // Tan color
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E8DBC5', // Slightly darker beige
    paddingVertical: 10,
    backgroundColor: '#F8F4E3', // Light beige
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    color: '#4A3C2C', // Warm brown
  },
});
