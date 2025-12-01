import React, { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import axios from 'axios';
import { Alert, ActivityIndicator, Modal, Linking } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FontAwesome5, Ionicons, MaterialIcons, Entypo } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import cropCalendarData from '../assets/crop.json';
import cropPriceData from '../assets/cropPrice.json';

const CROP_OPTIONS = ['Wheat', 'Rice', 'Maize', 'Cotton', 'Soybean'];
const SOIL_OPTIONS = ['Loamy', 'Clay', 'Sandy', 'Black', 'Red'];

const ADVICE = {
  Wheat: {
    Loamy: 'Wheat grows best in well-drained loamy soil with good fertility. Ensure timely irrigation and use nitrogen-rich fertilizers.',
    Clay: 'Wheat can grow in clay soil, but ensure proper drainage and avoid waterlogging.',
    Sandy: 'Add organic matter to sandy soil for wheat. Frequent irrigation is needed.',
    Black: 'Black soil is suitable for wheat. Maintain soil moisture and use balanced fertilizers.',
    Red: 'Red soil needs organic amendments for wheat. Use compost and irrigate regularly.',
  },
  Rice: {
    Loamy: 'Loamy soil is good for rice. Maintain standing water during growth.',
    Clay: 'Clay soil is ideal for rice. Ensure proper puddling before transplanting.',
    Sandy: 'Rice in sandy soil needs frequent irrigation and organic matter.',
    Black: 'Black soil can be used for rice with proper water management.',
    Red: 'Red soil needs organic matter and regular irrigation for rice.',
  },
  Maize: {
    Loamy: 'Maize thrives in loamy soil. Use phosphorus-rich fertilizers.',
    Clay: 'Clay soil needs good drainage for maize. Avoid waterlogging.',
    Sandy: 'Sandy soil for maize requires frequent watering and organic matter.',
    Black: 'Black soil is good for maize. Ensure timely sowing.',
    Red: 'Red soil needs organic amendments for maize.',
  },
  Cotton: {
    Loamy: 'Loamy soil is excellent for cotton. Use potash-rich fertilizers.',
    Clay: 'Cotton can grow in clay soil with good drainage.',
    Sandy: 'Sandy soil is not ideal for cotton. Add organic matter.',
    Black: 'Black soil is best for cotton. Ensure deep ploughing.',
    Red: 'Red soil needs organic matter for cotton.',
  },
  Soybean: {
    Loamy: 'Soybean prefers loamy soil. Use phosphorus and potassium fertilizers.',
    Clay: 'Clay soil needs good drainage for soybean.',
    Sandy: 'Sandy soil for soybean requires frequent irrigation.',
    Black: 'Black soil is suitable for soybean.',
    Red: 'Red soil needs organic matter for soybean.',
  },
};

export default function KrishiMitra() {
  // AI Crop Advisory
  const [crop, setCrop] = useState(CROP_OPTIONS[0]);
  const [soil, setSoil] = useState(SOIL_OPTIONS[0]);
  const [advice, setAdvice] = useState('');

  // Weather
  const [weather, setWeather] = useState('');
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [location, setLocation] = useState(null);

  // Crop Calendar
  const [selectedState, setSelectedState] = useState(
    cropCalendarData[0]?.state || ''
  );
  const [calendarResults, setCalendarResults] = useState([]);
  const [calendarError, setCalendarError] = useState('');

  // Crop Price Trends
  const [pricesVisible, setPricesVisible] = useState(false);
  const [selectedPriceState, setSelectedPriceState] = useState('');
  const [selectedPriceCommodity, setSelectedPriceCommodity] = useState('');
  const [filteredPrices, setFilteredPrices] = useState([]);

  // Agri News
  const [newsVisible, setNewsVisible] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsArticles, setNewsArticles] = useState([]);
  const [newsError, setNewsError] = useState('');

  // Get all unique states and commodities from cropPriceData
  const PRICE_STATES = Array.from(new Set(cropPriceData.map(item => item.state))).sort();
  const PRICE_COMMODITIES = Array.from(new Set(cropPriceData.map(item => item.commodity))).sort();

  // Get all unique states from crop.json
  const STATES = cropCalendarData
    .map((entry) => entry.state)
    .filter(Boolean)
    .sort();

  // Requesting location permission and fetching location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for weather updates.');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  // AI Crop Advisory logic
  const handleGetRecommendations = () => {
    if (crop && soil) {
      setAdvice(ADVICE[crop][soil]);
    } else {
      setAdvice('Please select both crop and soil type.');
    }
  };

  // Weather fetch logic
  const fetchWeather = async () => {
    if (!location) {
      Alert.alert('Location not available', 'Please allow location access.');
      return;
    }
    setWeatherLoading(true);
    const { latitude, longitude } = location.coords;
    const apiKey = 'b1992fdf15fb7860662c4542def14e02'; // Replace with your OpenWeatherMap API Key
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
      );
      const data = response.data;
      setWeather(
        `Location: ${data.name}\nWeather: ${data.weather[0].description}\nTemperature: ${data.main.temp}°C\nHumidity: ${data.main.humidity}%`
      );
    } catch (error) {
      setWeather('Unable to fetch weather data.');
    }
    setWeatherLoading(false);
  };

  // Crop Calendar logic
  const handleFetchCalendar = () => {
    try {
      const filtered = cropCalendarData.filter(
        (entry) => entry.state === selectedState
      );
      setCalendarResults(filtered);
      setCalendarError(filtered.length === 0 ? 'No data found for this state.' : '');
    } catch (e) {
      setCalendarError('Error loading crop calendar.');
      setCalendarResults([]);
    }
  };

  // Crop Price Trends logic
  const handleViewPrices = () => {
    setPricesVisible(true);
    // Default filter: show all if nothing selected
    let filtered = cropPriceData;
    if (selectedPriceState) {
      filtered = filtered.filter(item => item.state === selectedPriceState);
    }
    if (selectedPriceCommodity) {
      filtered = filtered.filter(item => item.commodity === selectedPriceCommodity);
    }
    setFilteredPrices(filtered);
  };

  // Update filtered prices when filters change
  useEffect(() => {
    if (pricesVisible) {
      let filtered = cropPriceData;
      if (selectedPriceState) {
        filtered = filtered.filter(item => item.state === selectedPriceState);
      }
      if (selectedPriceCommodity) {
        filtered = filtered.filter(item => item.commodity === selectedPriceCommodity);
      }
      setFilteredPrices(filtered);
    }
  }, [selectedPriceState, selectedPriceCommodity, pricesVisible]);

  const handleClosePrices = () => {
    setPricesVisible(false);
    setSelectedPriceState('');
    setSelectedPriceCommodity('');
    setFilteredPrices([]);
  };

  // Agri News logic
  const fetchAgriNews = async () => {
    setNewsVisible(true);
    setNewsLoading(true);
    setNewsError('');
    setNewsArticles([]);
    try {
      // Replace YOUR_API_KEY with your NewsAPI.org API key
      const response = await axios.get(
        'https://newsapi.org/v2/everything?q=agriculture OR farming OR crops&language=en&sortBy=publishedAt&pageSize=10&apiKey=1313d11f045f4f3f857e6f01169c608b'
        
      );
      setNewsArticles(response.data.articles);
    } catch (e) {
      setNewsError('Unable to fetch news. Please try again later.');
    }
    setNewsLoading(false);
  };

  // Other handlers
  const handleUploadImage = () => {
    Alert.alert('Upload', 'Image picker for pest/disease detection will be added.');
  };

  const handleTranslate = () => {
    Alert.alert('Translate', 'Multi-language support will be here.');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🌾 KrishiMitra – Your Smart Farming Companion</Text>

        {/* AI Crop Advisory */}
        <FeatureCard title="🌱 AI Crop Advisory" icon={<FontAwesome5 name="seedling" size={20} color="#33691e" />}>
          <Text style={styles.label}>Select Crop:</Text>
          <Picker
            selectedValue={crop}
            onValueChange={setCrop}
            style={styles.picker}
          >
            {CROP_OPTIONS.map(option => (
              <Picker.Item key={option} label={option} value={option} />
            ))}
          </Picker>
          <Text style={styles.label}>Select Soil Type:</Text>
          <Picker
            selectedValue={soil}
            onValueChange={setSoil}
            style={styles.picker}
          >
            {SOIL_OPTIONS.map(option => (
              <Picker.Item key={option} label={option} value={option} />
            ))}
          </Picker>
          <PrimaryButton text="Get Recommendations" onPress={handleGetRecommendations} />
          {advice ? <Text style={styles.advice}>{advice}</Text> : null}
        </FeatureCard>

        {/* Pest/Disease Detection */}
        <FeatureCard title="🪲 Pest/Disease Detection" icon={<MaterialIcons name="bug-report" size={22} color="#d32f2f" />}>
          <PrimaryButton text="Coming Soon" onPress={handleUploadImage} />
        </FeatureCard>

        {/* Seasonal Calendar */}
        <FeatureCard title="📅 Seasonal Crop Calendar" icon={<Ionicons name="calendar" size={20} color="#33691e" />}>
          <Text style={styles.description}>Select your state to view sowing/harvesting months and crops.</Text>
          <Text style={styles.label}>Select State:</Text>
          <Picker
            selectedValue={selectedState}
            onValueChange={setSelectedState}
            style={styles.picker}
          >
            {STATES.map((state) => (
              <Picker.Item key={state} label={state} value={state} />
            ))}
          </Picker>
          <PrimaryButton text="Show Crop Calendar" onPress={handleFetchCalendar} />
          {calendarError ? <Text style={{ color: 'red', marginTop: 10 }}>{calendarError}</Text> : null}
          {calendarResults.length > 0 && (
            <View style={{ marginTop: 10 }}>
              {calendarResults.map((item, idx) => (
                <View key={idx}>
                  <Text style={{ fontWeight: 'bold', color: '#33691e', marginBottom: 5 }}>{item.state}</Text>
                  <View style={{ backgroundColor: '#eef8e9', borderRadius: 8, padding: 8, marginBottom: 10 }}>
                    <Text style={{ fontWeight: 'bold' }}>Kharif Season</Text>
                    <Text>Months: {item.kharif.months.join(', ')}</Text>
                    <Text>Crops: {item.kharif.crops.join(', ')}</Text>
                  </View>
                  <View style={{ backgroundColor: '#f3e5f5', borderRadius: 8, padding: 8, marginBottom: 10 }}>
                    <Text style={{ fontWeight: 'bold' }}>Rabi Season</Text>
                    <Text>Months: {item.rabi.months.join(', ')}</Text>
                    <Text>Crops: {item.rabi.crops.join(', ')}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </FeatureCard>

        {/* Weather */}
        <FeatureCard title="🌦️ Live Weather Updates" icon={<Ionicons name="cloud-outline" size={22} color="#039be5" />}>
          <Text style={styles.description}>Location-based real-time weather info.</Text>
          <PrimaryButton text={weatherLoading ? "Loading..." : "Check Weather"} onPress={fetchWeather} />
          {weather ? <Text style={styles.weather}>{weather}</Text> : null}
        </FeatureCard>

        {/* Prices */}
        <FeatureCard title="💹 Crop Price Trends" icon={<MaterialIcons name="trending-up" size={22} color="#2e7d32" />}>
          <Text style={styles.description}>See real-time mandi prices and trends.</Text>
          <PrimaryButton text="View Prices" onPress={handleViewPrices} />
        </FeatureCard>

        {/* Agri News */}
        <FeatureCard title="📰 Agri News Feed" icon={<Entypo name="news" size={20} color="#6d4c41" />}>
          <PrimaryButton text="Read Latest News" onPress={fetchAgriNews} />
        </FeatureCard>

        {/* Chatbot 
        <FeatureCard title="🤖 Chatbot Advisor" icon={<Ionicons name="chatbubbles" size={20} color="#5e35b1" />}>
          <PrimaryButton text="Talk to Chatbot" onPress={() => Alert.alert('Chatbot', 'AI chatbot in development.')} />
        </FeatureCard>*/}

        {/* Voice Tips 
        <FeatureCard title="🔊 Voice-Based Tips" icon={<Ionicons name="mic-outline" size={20} color="#00897b" />}>
          <PrimaryButton text="Play Advice" onPress={() => Alert.alert('Voice', 'Voice tips will play.')} />
        </FeatureCard> */}

        {/* Language Support */}
        <FeatureCard title="🌐 Language Support" icon={<Ionicons name="language" size={20} color="#3949ab" />}>
          <PrimaryButton text="Coming Soon" onPress={handleTranslate} />
        </FeatureCard>
      </ScrollView>

      {/* Crop Prices Modal */}
      <Modal visible={pricesVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Crop Prices</Text>
            <Text style={styles.label}>Filter by State:</Text>
            <Picker
              selectedValue={selectedPriceState}
              onValueChange={setSelectedPriceState}
              style={styles.picker}
            >
              <Picker.Item label="All" value="" />
              {PRICE_STATES.map(state => (
                <Picker.Item key={state} label={state} value={state} />
              ))}
            </Picker>
            <Text style={styles.label}>Filter by Commodity:</Text>
            <Picker
              selectedValue={selectedPriceCommodity}
              onValueChange={setSelectedPriceCommodity}
              style={styles.picker}
            >
              <Picker.Item label="All" value="" />
              {PRICE_COMMODITIES.map(commodity => (
                <Picker.Item key={commodity} label={commodity} value={commodity} />
              ))}
            </Picker>
            <ScrollView style={{ maxHeight: 300, marginTop: 10 }}>
              {filteredPrices.length === 0 ? (
                <Text>No data available.</Text>
              ) : (
                filteredPrices.map((item, idx) => (
                  <View key={idx} style={styles.priceCard}>
                    <Text style={{ fontWeight: 'bold' }}>{item.commodity} ({item.variety})</Text>
                    <Text>Market: {item.market}, District: {item.district}, State: {item.state}</Text>
                    <Text>Date: {item.arrival_date}</Text>
                    <Text>Min: ₹{item.min_price}  Max: ₹{item.max_price}  Modal: ₹{item.modal_price} ({item.unit})</Text>
                  </View>
                ))
              )}
            </ScrollView>
            <PrimaryButton text="Close" onPress={handleClosePrices} />
          </View>
        </View>
      </Modal>

      {/* Agri News Modal */}
      <Modal visible={newsVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Agri News</Text>
            {newsLoading ? (
              <ActivityIndicator size="large" color="#33691e" />
            ) : newsError ? (
              <Text style={{ color: 'red' }}>{newsError}</Text>
            ) : (
              <ScrollView style={{ maxHeight: 350 }}>
                {newsArticles.length === 0 ? (
                  <Text>No news found.</Text>
                ) : (
                  newsArticles.map((article, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => Linking.openURL(article.url)}
                      style={styles.newsCard}
                    >
                      <Text style={{ fontWeight: 'bold', color: '#33691e' }}>{article.title}</Text>
                      <Text style={{ color: '#555', fontSize: 13 }}>{article.source.name} - {new Date(article.publishedAt).toLocaleDateString()}</Text>
                      <Text numberOfLines={2} style={{ color: '#333', marginBottom: 5 }}>{article.description}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
            <PrimaryButton text="Close" onPress={() => setNewsVisible(false)} />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const FeatureCard = ({ title, icon, children }) => (
  <View style={styles.card}>
    <View style={styles.header}>
      {icon}
      <Text style={styles.cardTitle}>  {title}</Text>
    </View>
    {children}
  </View>
);

const PrimaryButton = ({ text, onPress }) => (
  <TouchableOpacity style={styles.button} onPress={onPress} disabled={text === "Loading..."}>
    <Text style={styles.buttonText}>{text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f1f8e9',
    paddingBottom: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#33691e',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#558b2f',
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#33691e',
  },
  picker: {
    backgroundColor: '#eef8e9',
    borderRadius: 8,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#eef8e9',
    padding: 10,
    marginVertical: 8,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#7cb342',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  advice: {
    marginTop: 15,
    color: '#33691e',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  description: {
    color: '#555',
    fontSize: 14,
    marginBottom: 8,
  },
  weather: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#039be5',
    whiteSpace: 'pre-line',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
    color: '#2e7d32',
  },
  priceCard: {
    backgroundColor: '#f1f8e9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  newsCard: {
    backgroundColor: '#f9fbe7',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
});
