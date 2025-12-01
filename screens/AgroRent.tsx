import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView, View, Text, StyleSheet,
  TextInput, FlatList, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Alert, SectionList, Linking, Button, Image
} from 'react-native';
import axios from 'axios';
import API_CONFIG from '../config/apiConfig';

interface Equipment {
  _id: string;
  id?: string;
  name: string;
  category: string;
  price: number;
  description: string;
  ownerId: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
}

interface Request {
  _id: string;
  equipmentName: string;
  requestedBy: string;
  status: string;
  days?: number;
}

const CATEGORIES = ['All', 'Tractor', 'Weeder', 'Mower', 'Sprayer', 'Tool'];

export default function AgroRent() {
  const [mode, setMode] = useState("Renter");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>(equipmentList);

  const sections = useMemo(() => {
    const grouped = filteredEquipment.reduce((acc, equipment) => {
      if (!acc[equipment.category]) acc[equipment.category] = [];
      acc[equipment.category].push(equipment);
      return acc;
    }, {} as Record<string, Equipment[]>);
    return Object.keys(grouped).sort().map(category => ({
      title: category,
      data: grouped[category]
    }));
  }, [filteredEquipment]);

  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentCategory, setEquipmentCategory] = useState('');
  const [equipmentPrice, setEquipmentPrice] = useState('');
  const [equipmentDescription, setEquipmentDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [myListings, setMyListings] = useState<Equipment[]>([]);
  const [myRequests, setMyRequests] = useState<Request[]>([]);
  const [userId] = useState('user1');

  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [rentDays, setRentDays] = useState('');

  useEffect(() => {
    const filtered = equipmentList.filter(item => {
      const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
    setFilteredEquipment(filtered);
  }, [equipmentList, searchQuery, selectedCategory]);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const res = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EQUIPMENT}`);
      setEquipmentList(res.data);
      setFilteredEquipment(res.data);
    } catch (e) {
      Alert.alert('Error', 'Could not fetch equipment.');
    } finally {
      setLoading(false);
    }
  };

  const filterEquipment = () => {
    return equipmentList.filter(item => {
      const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      return matchesQuery && matchesCategory;
    
    });
  };

  const handleContactOwner = (equipment: Equipment) => {
    if (equipment.phone) {
      Linking.openURL(`tel:${equipment.phone}`);
    } else if (equipment.email) {
      Linking.openURL(`mailto:${equipment.email}`);
    } else {
      Alert.alert('Contact Info', `Owner: ${equipment.ownerId}\nNo contact info available.`);
    }
  };

  const handleBookNow = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setBookingModalVisible(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedEquipment || !rentDays || isNaN(Number(rentDays)) || Number(rentDays) <= 0) {
      Alert.alert('Error', 'Please enter a valid number of days.');
      return;
    }

    try {
      await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RENT_REQUESTS}`, {
        equipmentId: selectedEquipment._id,
        userId,
        days: Number(rentDays),
      });
      Alert.alert('Request Sent!', `Your rent request for ${rentDays} days has been sent to the owner.`);
      setBookingModalVisible(false);
      setSelectedEquipment(null);
      setRentDays('');
    } catch (e) {
      Alert.alert('Error', 'Could not send rent request.');
    }
  };

  // --- UPDATED RENT SUBMIT ---
  const handleRentSubmit = async () => {
    if (!equipmentName || !equipmentCategory || !equipmentPrice || !equipmentDescription) {
      Alert.alert('Please fill in all fields');
      return;
    }

    try {
      const payload = {
        name: equipmentName,
        category: equipmentCategory,
        price: Number(equipmentPrice),
        description: equipmentDescription,
        ownerId: userId,
        phone,
        email,
      };

      await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EQUIPMENT}`, payload);
      Alert.alert('Success', `Your equipment "${equipmentName}" is now listed!`);
      setEquipmentName('');
      setEquipmentCategory('');
      setEquipmentPrice('');
      setEquipmentDescription('');
      setPhone('');
      setEmail('');
      fetchEquipment();
    } catch (error) {
      console.log('Equipment submit error:', (error as any).message);
      Alert.alert('Error', 'Failed to submit equipment. Please try again.');
    }
  };

  const openDashboard = async () => {
    setDashboardVisible(true);
    try {
      const listingsRes = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EQUIPMENT}?ownerId=${userId}`);
      setMyListings(listingsRes.data);

      const requestsRes = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RENT_REQUESTS}?ownerId=${userId}`);
      setMyRequests(requestsRes.data);
    } catch (e) {
      Alert.alert('Error', 'Could not fetch dashboard data.');
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RENT_REQUESTS}/${requestId}/approve`);
      Alert.alert('Approved', 'Rent request approved.');
      openDashboard();
    } catch (e) {
      Alert.alert('Error', 'Could not approve request.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>🚜 AgroRent Equipment Rentals</Text>

        <View style={styles.modeContainer}>
          <TouchableOpacity onPress={() => setMode("Renter")} style={[styles.modeBtn, mode==="Renter" && styles.activeMode]}>
            <Text style={styles.modeText}>Renter</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode("Owner")} style={[styles.modeBtn, mode==="Owner" && styles.activeMode]}>
            <Text style={styles.modeText}>Owner</Text>
          </TouchableOpacity>
        </View>

        

        {/* Dashboard button - only visible to Owner */}
        {mode === "Owner" && (
          <TouchableOpacity style={styles.addBtn} onPress={openDashboard}>
            <Text style={styles.addBtnTxt}>📊 My Dashboard</Text>
          </TouchableOpacity>
        )}
        {mode === "Renter" && !dashboardVisible && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Search equipment"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <View style={styles.categories}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    selectedCategory === cat && styles.categoryActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}>
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === cat && styles.categoryTextActive,
                    ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <FlatList
              data={filteredEquipment}
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  {item.imageUrl && (
                    <Image source={{ uri: item.imageUrl }} style={styles.equipmentImage} />
                  )}
                  <View style={styles.cardContent}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.price}>₹{item.price}</Text>
                    <Text style={styles.desc}>{item.description}</Text>
                    <TouchableOpacity
                      style={styles.bookBtn}
                      onPress={() => mode === "Renter" ? handleBookNow(item) : handleBookNow(item)}>
                      <Text style={styles.bookText}>{mode === "Renter" ? "Rent Now" : "Book Now"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </>
        )}

        {/* Rent Equipment Form */}
        {mode === "Owner" && !dashboardVisible && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Rent Out Your Equipment</Text>
            <TextInput
              style={styles.input}
              placeholder="Equipment Name"
              value={equipmentName}
              onChangeText={setEquipmentName}
            />
            <TextInput
              style={styles.input}
              placeholder="Category"
              value={equipmentCategory}
              onChangeText={setEquipmentCategory}
            />
            <TextInput
              style={styles.input}
              placeholder="Price per day (₹)"
              value={equipmentPrice}
              onChangeText={setEquipmentPrice}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={equipmentDescription}
              onChangeText={setEquipmentDescription}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone (optional)"
              value={phone}
              onChangeText={setPhone}
            />
            <TextInput
              style={styles.input}
              placeholder="Email (optional)"
              value={email}
              onChangeText={setEmail}
            />
            <Button title="Submit Listing" onPress={handleRentSubmit} />
          </View>
        )}

        {/* Dashboard Modal */}
        {dashboardVisible && (
          <Modal visible={dashboardVisible} animationType="slide">
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
              <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Text style={styles.title}>My Equipment Listings</Text>
                {myListings.length === 0 ? (
                  <Text>No listings yet.</Text>
                ) : (
                  myListings.map(listing => (
                    <View key={listing._id || listing.id} style={styles.card}>
                      {listing.imageUrl && (
                        <Image source={{ uri: listing.imageUrl }} style={styles.equipmentImage} />
                      )}
                      <Text style={styles.name}>{listing.name}</Text>
                      <Text style={styles.price}>₹{listing.price}</Text>
                      <Text style={styles.desc}>{listing.description}</Text>
                    </View>
                  ))
                )}
                <Text style={[styles.title, { marginTop: 24 }]}>Rent Requests</Text>
                {myRequests.length === 0 ? (
                  <Text>No requests yet.</Text>
                ) : (
                  myRequests.map(req => (
                    <View key={req._id} style={styles.card}>
                      <Text style={styles.name}>Equipment: {req.equipmentName}</Text>
                      <Text>Requested by: {req.requestedBy}</Text>
                      <Text>Days: {req.days || 'N/A'}</Text>
                      <Text>Status: {req.status}</Text>
                      {req.status === 'pending' && (
                        <TouchableOpacity
                          style={styles.bookBtn}
                          onPress={() => handleApproveRequest(req._id)}>
                          <Text style={styles.bookText}>Approve</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
                <Button title="Close Dashboard" onPress={() => setDashboardVisible(false)} />
              </ScrollView>
            </SafeAreaView>
          </Modal>
        )}

        {/* Booking Modal */}
        <Modal visible={bookingModalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Book Equipment</Text>
              {selectedEquipment && (
                <>
                  <Text style={styles.name}>{selectedEquipment.name}</Text>
                  <Text style={styles.price}>₹{selectedEquipment.price} per day</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Number of days"
                    value={rentDays}
                    onChangeText={setRentDays}
                    keyboardType="numeric"
                  />
                  <Text style={{ marginBottom: 10 }}>Total Cost: ₹{rentDays ? (Number(rentDays) * selectedEquipment.price) : 0}</Text>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleConfirmBooking}>
                    <Text style={styles.saveBtnText}>Confirm Booking</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => { setBookingModalVisible(false); setRentDays(''); setSelectedEquipment(null); }}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, padding:20, backgroundColor:'#f4f4f9' },
  title:{ fontSize:24,fontWeight:'bold',textAlign:'center',marginBottom:15,color:'#2e7d32' },

  modeContainer:{ flexDirection:'row', justifyContent:'center', marginBottom:15 },
  modeBtn:{ padding:10, marginHorizontal:5, backgroundColor:'#bbb', borderRadius:8 },
  activeMode:{ backgroundColor:'#2e7d32' },
  modeText:{ color:'#fff', fontWeight:'bold' },

  addBtn:{ backgroundColor:'#1b5e20', padding:12, borderRadius:8, marginBottom:15 },
  addBtnTxt:{ color:'#fff', fontSize:16, textAlign:'center' },

  input:{ backgroundColor:'#fff', padding:10, borderRadius:8, marginBottom:10, borderWidth:1, borderColor:'#ddd' },

  categories:{ flexDirection:'row', flexWrap:'wrap', marginBottom:20 },
  categoryButton:{ backgroundColor:'#e0e0e0', borderRadius:20, paddingHorizontal:14, paddingVertical:6, margin:4 },
  categoryActive:{ backgroundColor:'#66bb6a' },
  categoryText:{ color:'#555' },
  categoryTextActive:{ color:'#fff', fontWeight:'bold' },

  card:{ backgroundColor:'#fff', padding:15, borderRadius:10, marginBottom:15, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:5, elevation:2 },
  cardContent:{ flex:1 },
  equipmentImage: { width: '100%', height: 150, borderRadius: 10, marginBottom: 10 },
  name:{ fontSize:18, fontWeight:'bold' },
  price:{ fontSize:16, color:'#2e7d32' },
  desc:{ fontSize:14, color:'#666' },

  bookBtn:{ backgroundColor:'#2e7d32', padding:8, borderRadius:6, marginTop:10, alignItems:'center' },
  bookText:{ color:'#fff', fontWeight:'bold' },

  form:{ backgroundColor:'#fff', borderRadius:10, padding:16, shadowColor:'#000', shadowOpacity:0.1, shadowRadius:10, elevation:3 },
  formTitle:{ fontSize:20, fontWeight:'bold', marginBottom:16 },

  modalContainer:{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', padding:15 },
  modalContent:{ backgroundColor:'#fff', borderRadius:10, padding:20 },
  modalTitle:{ fontSize:20, fontWeight:'bold', marginBottom:15, textAlign:'center' },
  modalInput:{ backgroundColor:'#f1f1f1', padding:12, borderRadius:6, marginBottom:10 },
  saveBtn:{ backgroundColor:'#2e7d32', padding:12, borderRadius:8, marginTop:10 },
  saveBtnText:{ color:'#fff', textAlign:'center', fontWeight:'bold' },
  cancelBtn:{ backgroundColor:'red', padding:12, borderRadius:8, marginTop:10 },
  cancelBtnText:{ color:'#fff', textAlign:'center', fontWeight:'bold' }
});
