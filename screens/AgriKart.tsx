import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView, View, Text, StyleSheet,
  TextInput, FlatList, TouchableOpacity, Image, Modal, ScrollView, ActivityIndicator, Alert, SectionList, Linking
} from 'react-native';
import axios from 'axios';
import API_CONFIG from '../config/apiConfig';

interface Product {
  _id: string;
  name: string;
  category: string;
  price: string;
  seller: string;
  imageUrl: string;
  phone?: string;
  email?: string;
}

interface Request {
  _id: string;
  productName: string;
  requestedBy: string;
  status: string;
  quantity?: number;
}

export default function AgriKart() {
  const [mode, setMode] = useState("Buyer");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);

  const sections = useMemo(() => {
    const grouped = filteredProducts.reduce((acc, product) => {
      if (!acc[product.category]) acc[product.category] = [];
      acc[product.category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
    return Object.keys(grouped).sort().map(category => ({
      title: category,
      data: grouped[category]
    }));
  }, [filteredProducts]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS}`);
      setProducts(res.data);
      setFilteredProducts(res.data);
    } catch (e) {
      Alert.alert('Error', 'Could not fetch products.');
    } finally {
      setLoading(false);
    }
  };
  const [modalVisible, setModalVisible] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", category: "", price: "", seller:"", phone: "", email: "" });

  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [requestQuantity, setRequestQuantity] = useState('');

  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [myListings, setMyListings] = useState<Product[]>([]);
  const [myRequests, setMyRequests] = useState<Request[]>([]);
  const [userId] = useState('user1');

  const normalizeCategory = (category: string) => {
    const lower = category.toLowerCase();
  
    if (lower === 'flowers' || lower === 'flower' || lower === 'Flower') return 'Flowers';
    if (lower === 'plants' || lower === 'plant'  || lower === 'Plant') return 'Plants';
    if (lower === 'fruits' || lower === 'fruit'  || lower === 'Fruit') return 'Fruits';
    if (lower === 'vegetables' || lower === 'vegetable' || lower === 'Vegetable') return 'Vegetables';
    if (lower === 'seeds' || lower === 'seed' || lower === 'Seed') return 'Seeds';
    return category; // keep as is for others
  };

  const getImageUrlForCategory = (category: string) => {
    switch (category.toLowerCase()) {
      case 'fruits':
        return 'https://png.pngtree.com/png-clipart/20241109/original/pngtree-beautiful-various-fruits-item-and-healthy-clipart-png-image_16788969.png';
      case 'vegetables':
        return 'https://www.lalpathlabs.com/blog/wp-content/uploads/2019/01/Fruits-and-Vegetables.jpg';
      case 'seeds': 
        return 'https://nyspiceshop.com/cdn/shop/articles/TYPES_OF_NUTS_AND_SEEDS_AND_THEIR_HEALTH_BENEFITS.jpeg?v=1730226897';
      case 'Flowers':
        return 'https://images.unsplash.com/photo-1713791234964-9bd41543a20f?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
        case 'plants':      
        return 'https://twinflowerstudio.com/cdn/shop/collections/PXL_20230424_215121564.PORTRAIT_1024x1024_2x_df27543e-15d5-4cea-9074-98d86bdfab08.webp?v=1746492760';
      default:
        return 'https://via.placeholder.com/70'; // fallback
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.category || !newProduct.price || !newProduct.seller) {
      alert("Please fill all fields");
      return;
    }

    const normalizedCategory = normalizeCategory(newProduct.category);

    try {
      const res = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS}`, {
        name: newProduct.name,
        category: normalizedCategory,
        price: newProduct.price,
        seller: newProduct.seller,
        sellerId: userId,
        phone: newProduct.phone,
        email: newProduct.email,
        imageUrl: getImageUrlForCategory(normalizedCategory)
      });
      setProducts(prev => [...prev, res.data]);
      setFilteredProducts(prev => [...prev, res.data]);
      setModalVisible(false);
      setNewProduct({ name: "", category: "", price: "", seller: "", phone: "", email: "" });
    } catch (e) {
      Alert.alert('Error', 'Could not add product.');
    }
  };

  const handleContactSeller = (product: Product) => {
    if (product.phone) {
      Linking.openURL(`tel:${product.phone}`);
    } else if (product.email) {
      Linking.openURL(`mailto:${product.email}`);
    } else {
      Alert.alert('Contact Info', `Seller: ${product.seller}\nNo contact info available.`);
    }
  };

  const handleRequestProduct = (product: Product) => {
    setSelectedProduct(product);
    setRequestModalVisible(true);
  };

  const handleConfirmRequest = async () => {
    if (!selectedProduct || !requestQuantity || isNaN(Number(requestQuantity)) || Number(requestQuantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity.');
      return;
    }

    try {
      await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCT_REQUESTS}`, {
        productId: selectedProduct._id,
        userId,
        quantity: Number(requestQuantity),
      });
      Alert.alert('Request Sent!', `Your request for ${requestQuantity} units of ${selectedProduct.name} has been sent to the seller.`);
      setRequestModalVisible(false);
      setSelectedProduct(null);
      setRequestQuantity('');
    } catch (e) {
      Alert.alert('Error', 'Could not send product request.');
    }
  };

  const openDashboard = async () => {
    setDashboardVisible(true);
    try {
      const listingsRes = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS}?sellerId=${userId}`);
      setMyListings(listingsRes.data);

      const requestsRes = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCT_REQUESTS}?sellerId=${userId}`);
      setMyRequests(requestsRes.data);
    } catch (e) {
      Alert.alert('Error', 'Could not fetch dashboard data.');
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCT_REQUESTS}/${requestId}/approve`);
      Alert.alert('Approved', 'Product request approved.');
      openDashboard();
    } catch (e) {
      Alert.alert('Error', 'Could not approve request.');
    }
  };

  // Search & Filter
  const filterProducts = (category = selectedCategory) => {
    const filtered = products.filter(item => {
      const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = category === "All" || item.category === category;
      return matchesQuery && matchesCategory;
    });
    setFilteredProducts(filtered);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>

        {/* Title */}
        <Text style={styles.title}>🛒 AgriKart – B2B Marketplace</Text>

        {/* Mode Switch */}
        <View style={styles.modeContainer}>
          <TouchableOpacity onPress={() => setMode("Buyer")} style={[styles.modeBtn, mode==="Buyer" && styles.activeMode]}>
            <Text style={styles.modeText}>Buyer</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode("Seller")} style={[styles.modeBtn, mode==="Seller" && styles.activeMode]}>
            <Text style={styles.modeText}>Seller</Text>
          </TouchableOpacity>
        </View>

        {/* Add product button */}
        {mode === "Seller" && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
            <TouchableOpacity style={[styles.addBtn, { flex: 1, marginRight: 10 }]} onPress={() => setModalVisible(true)}>
              <Text style={styles.addBtnTxt}>➕ Add Product</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.addBtn, { flex: 1, marginLeft: 10 }]} onPress={openDashboard}>
              <Text style={styles.addBtnTxt}>📊 Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput style={styles.input} placeholder="Search Products" value={searchQuery} onChangeText={setSearchQuery} />
          <TouchableOpacity style={styles.searchBtn} onPress={() => filterProducts()}>
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Category filter */}
        <FlatList
          data={['All', 'Vegetables', 'Fruits', 'Flowers', 'Seeds', 'Plants']}
          horizontal
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => { setSelectedCategory(item); filterProducts(item); }}
              style={[styles.categoryBtn, selectedCategory === item && styles.selectedCategoryBtn]}>
              <Text style={styles.categoryText}>{item}</Text>
            </TouchableOpacity>
          )}
          style={{ position: 'absolute', top: 214, left: 20, right: 20, zIndex: 1, backgroundColor: '#f4f4f9', marginBottom: 15 }}
        />

        {/* Products List */}
        {loading ? (
          <ActivityIndicator size="large" color="#2e7d32" />
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <View style={styles.productItem}>
                <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productCategory}>{item.category}</Text>
                  <Text style={styles.productPrice}>{item.price}</Text>
                  <Text style={styles.seller}>Seller: {item.seller}</Text>

                  <TouchableOpacity style={styles.requestBtn} onPress={() => mode === "Buyer" ? handleRequestProduct(item) : alert("Edit not implemented yet")}>
                    <Text style={styles.requestBtnText}>{mode === "Buyer" ? "Request Product" : "Edit Product"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            style={{ marginTop: 100 }}
          />
        )}

        {/* Add Product Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Product</Text>

              <TextInput style={styles.modalInput} placeholder="Product Name" onChangeText={v=>setNewProduct({...newProduct,name:v})} />
              <TextInput style={styles.modalInput} placeholder="Category (Vegetables/Flowers/Fruits etc...)" onChangeText={v=>setNewProduct({...newProduct,category:v})} />
              <TextInput style={styles.modalInput} placeholder="Price Example: ₹50/kg" onChangeText={v=>setNewProduct({...newProduct,price:v})} />
              <TextInput style={styles.modalInput} placeholder="Seller Name / Garden / Mandi" onChangeText={v=>setNewProduct({...newProduct,seller:v})} />
              <TextInput style={styles.modalInput} placeholder="Seller Phone (optional)" onChangeText={v=>setNewProduct({...newProduct,phone:v})} />
              <TextInput style={styles.modalInput} placeholder="Seller Email (optional)" onChangeText={v=>setNewProduct({...newProduct,email:v})} />

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddProduct}>
                <Text style={styles.saveBtnText}>Save Product</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>

        {/* Request Product Modal */}
        <Modal visible={requestModalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Request Product</Text>
              {selectedProduct && (
                <>
                  <Text style={styles.productName}>{selectedProduct.name}</Text>
                  <Text style={styles.productCategory}>{selectedProduct.category}</Text>
                  <Text style={styles.productPrice}>{selectedProduct.price}</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter quantity"
                    value={requestQuantity}
                    onChangeText={setRequestQuantity}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity style={styles.saveBtn} onPress={handleConfirmRequest}>
                    <Text style={styles.saveBtnText}>Send Request</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setRequestModalVisible(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Dashboard Modal */}
        <Modal visible={dashboardVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalTitle}>Seller Dashboard</Text>

              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>My Listings</Text>
              {myListings.length === 0 ? (
                <Text>No listings yet.</Text>
              ) : (
                myListings.map(listing => (
                  <View key={listing._id} style={styles.productItem}>
                    <Image source={{ uri: listing.imageUrl }} style={styles.productImage} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{listing.name}</Text>
                      <Text style={styles.productCategory}>{listing.category}</Text>
                      <Text style={styles.productPrice}>{listing.price}</Text>
                    </View>
                  </View>
                ))
              )}

              <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 }}>Product Requests</Text>
              {myRequests.length === 0 ? (
                <Text>No requests yet.</Text>
              ) : (
                myRequests.map(request => (
                  <View key={request._id} style={styles.productItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{request.productName}</Text>
                      <Text style={styles.productCategory}>Requested by: {request.requestedBy}</Text>
                      <Text style={styles.productPrice}>Quantity: {request.quantity}</Text>
                      <Text style={styles.seller}>Status: {request.status}</Text>
                      {request.status === 'pending' && (
                        <TouchableOpacity style={styles.requestBtn} onPress={() => handleApproveRequest(request._id)}>
                          <Text style={styles.requestBtnText}>Approve</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              )}

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDashboardVisible(false)}>
                <Text style={styles.cancelBtnText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
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

  searchContainer:{ flexDirection:'row', marginBottom:15 },
  input:{ backgroundColor:'#fff',flex:1,padding:10,borderRadius:8,borderWidth:1,borderColor:'#ddd' },
  searchBtn:{ backgroundColor:'#2e7d32', padding:12,borderRadius:8,marginLeft:10 },
  searchBtnText:{ color:'#fff' },

  categoryBtn:{ backgroundColor:'#66bb6a', padding:8,borderRadius:5,marginRight:10 },
  selectedCategoryBtn:{ backgroundColor:'#1b5e20' },
  categoryText:{ color:'#fff' },

  productItem:{ flexDirection:'row', backgroundColor:'#fff', padding:15, borderRadius:10, marginBottom:15 },
  productImage:{ width:70, height:70, marginRight:15, resizeMode:'contain' },
  productName:{ fontSize:18, fontWeight:'bold' },
  productCategory:{ fontSize:14, color:'#757575' },
  productPrice:{ fontSize:16, color:'#2e7d32' },
  seller:{ fontSize:14, color:'#000' },

  requestBtn:{ backgroundColor:'#2e7d32', padding:8, borderRadius:6, marginTop:10, alignItems:'center' },
  requestBtnText:{ color:'#fff', fontWeight:'bold' },

  modalContainer:{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', padding:15 },
  modalContent:{ backgroundColor:'#fff', borderRadius:10, padding:20 },
  modalTitle:{ fontSize:20, fontWeight:'bold', marginBottom:15, textAlign:'center' },
  modalInput:{ backgroundColor:'#f1f1f1', padding:12, borderRadius:6, marginBottom:10 },
  saveBtn:{ backgroundColor:'#2e7d32', padding:12, borderRadius:8, marginTop:10 },
  saveBtnText:{ color:'#fff', textAlign:'center', fontWeight:'bold' },
  cancelBtn:{ backgroundColor:'red', padding:12, borderRadius:8, marginTop:10 },
  cancelBtnText:{ color:'#fff', textAlign:'center', fontWeight:'bold' }
});
