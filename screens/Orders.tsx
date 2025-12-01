import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from '../config/apiConfig';

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS}`);
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        } else {
          console.error('Failed to fetch orders');
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };
    fetchOrders();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Order History</Text>
        <FlatList
          data={orders}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleString()}</Text>
              {item.user && (
                <Text style={styles.orderDetail}>Ordered by: {item.user.name} ({item.user.email})</Text>
              )}
              <Text style={styles.orderDetail}>Address: {item.address}</Text>
              <Text style={styles.orderDetail}>Contact: {item.contact}</Text>
              <Text style={styles.orderDetail}>Payment: {item.paymentMode}</Text>
              <Text style={styles.orderDetail}>Status: {item.status}</Text>
              <Text style={styles.orderDetail}>Total: ₹{item.total}</Text>
              <Text style={styles.orderDetail}>Items:</Text>
              {item.items.map((prod, idx) => (
                <Text key={idx} style={styles.orderItem}>
                  - {prod.name} x {prod.quantity} @ ₹{prod.price}
                </Text>
              ))}
            </View>
          )}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40 }}>No orders yet.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0f4f8' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1b5e20', textAlign: 'center', marginBottom: 20 },
  orderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  orderDate: { fontWeight: 'bold', color: '#388e3c', marginBottom: 5 },
  orderDetail: { fontSize: 14, color: '#333' },
  orderItem: { fontSize: 13, color: '#555', marginLeft: 10 },
});