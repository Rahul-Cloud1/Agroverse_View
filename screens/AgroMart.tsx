import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text } from 'react-native';

import {
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Image,
  TextInput,
  Platform,
  UIManager,
  LayoutAnimation,
  Animated,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_CONFIG from '../config/apiConfig';

interface Product {
  _id: string;
  name: string;
  category: string;
  price: string;  
  brand: string;
  imageUrl: string;
  moreImages?: string[];
  video?: string;
}


if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}



import { StackNavigationProp } from '@react-navigation/stack';

type AgroMartProps = {
  navigation: StackNavigationProp<any>;
};

export default function AgroMart({ navigation }: AgroMartProps) {
  const [cart, setCart] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cartVisible, setCartVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [paymentMode, setPaymentMode] = useState('COD');
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTSB2C}`);
      setProducts(res.data);
    } catch (e) {
      Alert.alert('Error', 'Could not fetch products.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const existingItem = cart.find(cartItem => cartItem.id === item._id);

    if (existingItem) {
      const updatedCart = cart.map(cartItem =>
        cartItem.id === item._id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
      setCart(updatedCart);
    } else {
      setCart([...cart, { id: item._id, name: item.name, price: parseFloat(item.price), quantity: 1 }]);
    }
  };

  const showProductDetails = (item: any) => {
    setSelectedProduct(item);
    setModalVisible(true);
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const filteredProducts = products.filter(item => {
    const matchesSearchQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    return matchesSearchQuery && matchesCategory;
  });

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const handleCheckout = async () => {
    if (!address || !contact) {
      alert('Please enter address and contact details.');
      return;
    }
    // Create order object
    const order = {
      items: cart,
      total,
      address,
      contact,
      paymentMode,
    };

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        alert('Please login to place an order.');
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(order),
      });

      if (response.ok) {
        const savedOrder = await response.json();
        console.log('Order saved:', savedOrder);
        setOrderConfirmed(true);
        setCart([]);
        setTimeout(() => {
          setCheckoutVisible(false);
          setCartVisible(false);
          setOrderConfirmed(false);
          setAddress('');
          setContact('');
          setPaymentMode('COD');
          // Optionally navigate to Orders page
          // navigation.navigate('Orders');
        }, 1500);
      } else {
        alert('Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please check your connection.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>AgroMart – Product Store</Text>

        <View style={styles.topBar}>
          <TextInput
            style={styles.searchBar}
            placeholder="Search Products"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.cartBtnTop} onPress={() => setCartVisible(true)}>
            <Text style={styles.cartText}>🛒 {cart.length}</Text>
          </TouchableOpacity>
        </View>

        {/* Category Filter */}
        <View style={styles.categoryFilterContainer}>
          <FlatList
            data={['All', 'Power Weeders', 'Lawn Mowers', 'Chain Saws', 'Brush Cutters', 'Hedge Trimmers', 'Earth Augers', 'Hand Tools', 'Sprayers', 'Spreaders', 'Water Pumps', 'Generators']}
            keyExtractor={item => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleCategorySelect(item === 'All' ? '' : item)}
                style={[
                  styles.categoryBtn,
                  selectedCategory === item && styles.selectedCategoryBtn,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === item && styles.selectedCategoryText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Product List */}
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <Animated.View style={styles.item}>
                <TouchableOpacity onPress={() => showProductDetails(item)}>
                  <Image source={{uri: item.imageUrl}} style={styles.image} />
                  <View style={styles.productInfo}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.price}>₹{item.price}</Text>
                    <TouchableOpacity style={styles.cartBtn} onPress={() => addToCart(item)}>
                      <Text style={styles.cartText}>Add to Cart</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buyNowBtn}>
                      <Text style={styles.buyNowText}>Buy Now</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )}
          />
        )}

        {/* Cart Modal */}
        <Modal visible={cartVisible} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>🛍️ Your Cart</Text>
              {cart.map((item, idx) => (
                <Text key={idx} style={styles.modalText}>
                  {item.name} - ₹{item.price} x {item.quantity} = ₹{item.price * item.quantity}
                </Text>
              ))}
              <Text style={[styles.modalText, { fontWeight: 'bold' }]}>
                Total: ₹{total}
              </Text>
              <TouchableOpacity style={styles.checkoutBtn} onPress={() => setCheckoutVisible(true)}>
                <Text style={styles.checkoutText}>Checkout</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCartVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Checkout Modal */}
        <Modal visible={checkoutVisible} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Checkout</Text>
              {orderConfirmed ? (
                <Text style={{ color: 'green', fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>
                  Order Confirmed!
                </Text>
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Delivery Address"
                    value={address}
                    onChangeText={setAddress}
                    multiline
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Contact Number"
                    value={contact}
                    onChangeText={setContact}
                    keyboardType="phone-pad"
                  />
                  <Text style={{ marginTop: 10, marginBottom: 5, fontWeight: 'bold' }}>Payment Mode</Text>
                  <TouchableOpacity
                    style={[
                      styles.paymentOption,
                      paymentMode === 'COD' && { backgroundColor: '#388e3c' },
                    ]}
                    onPress={() => setPaymentMode('COD')}
                  >
                    <Text style={{ color: paymentMode === 'COD' ? '#fff' : '#388e3c' }}>Cash on Delivery (COD)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.paymentOption,
                      paymentMode === 'ONLINE' && { backgroundColor: '#388e3c' },
                    ]}
                    onPress={() => setPaymentMode('ONLINE')}
                    disabled // Only COD enabled for now
                  >
                    <Text style={{ color: paymentMode === 'ONLINE' ? '#fff' : '#388e3c', opacity: 0.5 }}>
                      Online Payment (Coming Soon)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
                    <Text style={styles.checkoutText}>Place Order</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setCheckoutVisible(false)} style={styles.closeBtn}>
                    <Text style={styles.closeText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Product Details Modal */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <ScrollView contentContainerStyle={styles.modalContainer}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>{selectedProduct?.name}</Text>
              <Image source={{uri: selectedProduct?.imageUrl}} style={styles.modalImage} />
              <Text style={styles.modalText}>Price: ₹{selectedProduct?.price}</Text>
              <Text style={styles.modalText}>Brand: {selectedProduct?.brand}</Text>

              {/* More Images */}
              <FlatList
                data={selectedProduct?.moreImages}
                keyExtractor={(item, index) => index.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.moreImagesContainer}
                renderItem={({ item }) => <Image source={{uri: item}} style={styles.moreImage} />}
              />

              {/* Product Video */}
              {selectedProduct?.video && (
                <View style={styles.videoContainer}>
                  <Text style={styles.videoText}>Product Video</Text>
                  <TouchableOpacity onPress={() => Linking.openURL(selectedProduct.video!)}>
                    <Text style={styles.videoUrl}>Play Video</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}



/// Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0f4f8' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1b5e20', textAlign: 'center', marginBottom: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  searchBar: {
    flex: 1,
    height: 45,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  cartBtnTop: { backgroundColor: '#ff5722', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 30 },
  cartText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  categoryFilterContainer: { marginBottom: 20 },
  categoryList: { paddingVertical: 10 },
  categoryBtn: {
    backgroundColor: '#e8f5e9',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginRight: 12,
  },
  selectedCategoryBtn: { backgroundColor: '#81c784' },
  categoryText: { color: '#2e7d32', fontWeight: '600', fontSize: 14 },
  selectedCategoryText: { color: '#fff' },
  item: { backgroundColor: '#ffffff', borderRadius: 15, padding: 15, marginBottom: 20, alignItems: 'center' },
  image: { width: 160, height: 160, borderRadius: 10, marginBottom: 10, resizeMode: 'contain' },
  productInfo: { alignItems: 'center' },
  name: { fontWeight: 'bold', fontSize: 16, color: '#388e3c' },
  price: { fontSize: 14, color: '#388e3c', marginBottom: 10 },
  cartBtn: { backgroundColor: '#ff5722', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 30, marginBottom: 5 },
  buyNowBtn: { backgroundColor: '#388e3c', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 30 },
  buyNowText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBox: { backgroundColor: '#fff', padding: 20, borderRadius: 15, width: Dimensions.get('window').width - 40 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  modalText: { fontSize: 14, textAlign: 'center', marginBottom: 10 },
  modalImage: { width: '100%', height: 200, borderRadius: 15, resizeMode: 'contain', marginBottom: 10 },
  modalDescription: { fontSize: 12, color: '#555', marginBottom: 10 },
  moreImagesContainer: { paddingVertical: 5 },
  moreImage: { width: 100, height: 100, borderRadius: 10, marginRight: 10, resizeMode: 'contain' },
  videoContainer: { marginTop: 10, marginBottom: 20 },
  videoText: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  videoUrl: { fontSize: 14, color: '#388e3c', textAlign: 'center' },
  closeBtn: { backgroundColor: '#f44336', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 30, marginTop: 15 },
  closeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  checkoutBtn: { backgroundColor: '#388e3c', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 30, marginTop: 15 },
  checkoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  input: {
    backgroundColor: '#eef8e9',
    padding: 10,
    marginVertical: 8,
    borderRadius: 8,
    fontSize: 16,
  },
  paymentOption: {
    borderWidth: 1,
    borderColor: '#388e3c',
    borderRadius: 8,
    padding: 12,
    marginVertical: 5,
    alignItems: 'center',
  },
});

