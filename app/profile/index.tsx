import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';
import TabBar from '../../components/TabBar';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const goToSignIn = () => {
    router.push('/auth/sign-in');
  };

  const goToHome = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goToHome} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4A3C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle-outline" size={80} color="#5D4FB7" />
          </View>
          
          {user ? (
            <>
              <Text style={styles.emailText}>{user.email}</Text>
              
              <View style={styles.infoContainer}>
                <View style={styles.infoItem}>
                  <Ionicons name="mail-outline" size={20} color="#8B7355" />
                  <Text style={styles.infoText}>Email verified: {user.email_confirmed_at ? 'Yes' : 'No'}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Ionicons name="calendar-outline" size={20} color="#8B7355" />
                  <Text style={styles.infoText}>
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.signOutButton}
                onPress={handleSignOut}
              >
                <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.guestText}>Guest User</Text>
              <Text style={styles.guestSubtext}>
                Sign in to sync your packing lists across devices
              </Text>
              
              <TouchableOpacity 
                style={styles.signInButton}
                onPress={goToSignIn}
              >
                <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About Packie</Text>
          <Text style={styles.aboutText}>
            Packie is your smart packing assistant that helps you create and manage packing lists for your trips.
            Take photos of items and let our AI identify them for quick list creation.
          </Text>
          
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>
      </ScrollView>
      
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
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#E8DBC5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A3C2C',
    marginLeft: 15,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    backgroundColor: '#F8F4E3',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8DBC5',
  },
  avatarContainer: {
    marginBottom: 15,
  },
  emailText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3C2C',
    marginBottom: 15,
  },
  guestText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3C2C',
    marginBottom: 5,
  },
  guestSubtext: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoContainer: {
    width: '100%',
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#4A3C2C',
    marginLeft: 10,
  },
  signOutButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  aboutSection: {
    backgroundColor: '#F8F4E3',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8DBC5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3C2C',
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 14,
    color: '#4A3C2C',
    lineHeight: 20,
  },
  versionContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#8B7355',
  },
}); 