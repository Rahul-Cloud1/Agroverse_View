import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  Button,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from '../config/apiConfig';

export default function HomeScreen() {
  const navigation = useNavigation();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);

  React.useEffect(() => {
    const loadToken = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('token');
        if (savedToken) {
          setToken(savedToken);
        }
      } catch (err) {
        console.error('Error loading token:', err);
        Alert.alert('Error', 'Failed to load saved session.');
      }
    };
    loadToken();
  }, []);

  const logout = async (message) => {
    await AsyncStorage.removeItem('token');
    setToken(null);
    setFullName('');
    setContactNo('');
    setAddress('');
    if (message) Alert.alert('Session expired', message);
  };

  const checkResponse = async (res) => {
    if (res.status === 401) {
      await logout('Your session has expired. Please login again.');
      throw new Error('Unauthorized');
    }
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Unknown error');
    }
    return res.json();
  };

  const handleAuth = async () => {
    setLoading(true);
    try {
      const route = isRegister ? API_CONFIG.ENDPOINTS.AUTH.REGISTER : API_CONFIG.ENDPOINTS.AUTH.LOGIN;
      const body = isRegister
        ? { email, password, name: fullName, contactNo, address }
        : { email, password };
      const res = await fetch(`${API_CONFIG.BASE_URL}${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await checkResponse(res);
      await AsyncStorage.setItem('token', data.token);
      setToken(data.token);
      Alert.alert('Success', `${isRegister ? 'Registered' : 'Logged in'} successfully!`);
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <Text style={styles.title}>🌐 AgroVerse</Text>
            {token && (
              <>
                <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')} style={styles.navIcon}>
                  <FontAwesome name="home" size={25} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => logout()} style={styles.navIcon}>
                  <FontAwesome name="sign-out" size={25} color="#fff" />
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.subtitle}>Explore the World of Agriculture and Gardening</Text>

          {!token ? (
            <View style={styles.profileSection}>
              <Text style={styles.sectionTitle}>{isRegister ? 'Register' : 'Login'}</Text>
              <TextInput
                placeholder="Email"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <TextInput
                placeholder="Password"
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                textContentType="password"
              />
              {isRegister && (
                <>
                  <TextInput
                    placeholder="Full Name"
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                  <TextInput
                    placeholder="Contact No"
                    style={styles.input}
                    value={contactNo}
                    onChangeText={setContactNo}
                    keyboardType="phone-pad"
                  />
                  <TextInput
                    placeholder="Address"
                    style={[styles.input, { height: 80 }]}
                    value={address}
                    onChangeText={setAddress}
                    multiline
                  />
                </>
              )}
              <Button title={isRegister ? 'Register' : 'Login'} onPress={handleAuth} disabled={loading} />
              <TouchableOpacity onPress={() => setIsRegister(!isRegister)} style={{ marginTop: 10 }}>
                <Text style={{ color: '#33691e', textAlign: 'center' }}>
                  {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {loading && <ActivityIndicator size="large" color="#33691e" />}
              <View style={styles.featuresContainer}>
                <View style={styles.featureRow}>
                  <TouchableOpacity
                    style={styles.featureButton}
                    onPress={() => navigation.navigate('Main', { screen: 'KrishiMitra' })}
                  >
                    <Image source={require('../assets/Images/others/krishimitra.png')}  style={styles.featureImage} />
                    <Text style={styles.buttonText}>🌾 KrishiMitra</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.featureButton}
                    onPress={() => navigation.navigate('Main', { screen: 'AgroMart' })}
                  >
                    <Image source={require('../assets/Images/others/agromart.jpeg')} style={styles.featureImage} />
                    <Text style={styles.buttonText}>🛒 AgroMart</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.featureRow}>
                  <TouchableOpacity
                    style={styles.featureButton}
                    onPress={() => navigation.navigate('Main', { screen: 'AgroRent' })}
                  >
                    <Image source={require('../assets/Images/others/agrorent.jpeg')} style={styles.featureImage} />
                    <Text style={styles.buttonText}>🚜 AgroRent</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.featureButton}
                    onPress={() => navigation.navigate('Main', { screen: 'AgriKart' })}
                  >
                    <Image source={require('../assets/Images/others/agrikart.jpg')} style={styles.featureImage} />
                    <Text style={styles.buttonText}>🛍️ AgriKart</Text> 
                  </TouchableOpacity>
                </View>
                <View style={styles.featureRow}>
                 
                  
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#e8f5e9',
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navIcon: {
    backgroundColor: '#33691e',
    padding: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#33691e',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#558b2f',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  profileSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginVertical: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  featuresContainer: {
    marginTop: 20,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  featureButton: {
    backgroundColor: '#33691e',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    width: '48%',
  },
  featureImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
});
