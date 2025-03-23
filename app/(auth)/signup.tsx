import { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'expo-router';


export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const { signUp, loading, error } = useAuth();
  
  // Animation states
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

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setPasswordError(null);
    
    if (email && password) {
      await signUp(email, password);
      // If no error occurred during signup, show success message
      if (!error) {
        setSignupSuccess(true);
      }
    }
  };

  if (signupSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.mascotContainer}>
          <Image 
            source={require('../../assets/images/packie1.svg')} 
            style={styles.mascotImage}
            resizeMode="contain"
          />
          <Text style={styles.mascotText}>{animatedText}</Text>
        </View>
        
        <Text style={styles.title}>Account Created!</Text>
        <Text style={styles.confirmationText}>
          Please check your email ({email}) to confirm your account.
        </Text>
        <Text style={styles.confirmationSubtext}>
          You won't be able to sign in until you verify your email address.
        </Text>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already verified? </Text>
          <Link href="/(auth)/signin">
            <Text style={styles.link}>Sign In</Text>
          </Link>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mascotContainer}>
        <Image 
          source={require('../../assets/images/packie1.svg')} 
          style={styles.mascotImage}
          resizeMode="contain"
        />
        <Text style={styles.mascotText}>{animatedText}</Text>
      </View>
      
      <Text style={styles.title}>Create an Account</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
      
      <Text style={styles.inputLabel}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <Text style={styles.inputLabel}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <Text style={styles.inputLabel}>Confirm Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#8B7355" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/(auth)/signin">
          <Text style={styles.link}>Sign In</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#F5F5DC', // Beige background
  },
  mascotContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mascotImage: {
    width: 180, // Larger mascot
    height: 180, // Larger mascot
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#4A3C2C',
    textAlign: 'left',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#4A3C2C',
  },
  input: {
    backgroundColor: '#F8F4E3',
    borderWidth: 1,
    borderColor: '#E8DBC5',
    padding: 15,
    marginBottom: 20,
    borderRadius: 8,
    fontSize: 16,
    color: '#4A3C2C',
  },
  button: {
    backgroundColor: '#D2B48C', // Tan button color
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  mascotText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B7355', // Warm brown color to match theme
    marginTop: 10,
    fontFamily: 'System',
    textAlign: 'center',
  },
  buttonText: {
    color: '#4A3C2C',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    color: '#4A3C2C',
    fontSize: 14,
  },
  link: {
    color: '#8B7355', // Darker tan for links
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorText: {
    color: '#C43E00', // Warmer red for errors
    marginBottom: 15,
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    color: '#4A3C2C',
  },
  confirmationSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    color: '#6B5B45',
  },
});
