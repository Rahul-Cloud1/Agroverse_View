import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import HomeScreen from './screens/HomeScreen';
import KrishiMitra from './screens/KrishiMitra';
import AgroMart from './screens/AgroMart';
import AgroRent from './screens/AgroRent';
import AgriKart from './screens/AgriKart';
import Orders from './screens/Orders';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function CustomHeader({ title }: { title: string }) {
  return (
    <View style={styles.headerContainer}>
      <FontAwesome name="leaf" size={30} color="#fff" />
      <Text style={styles.headerText}>{title}</Text>
    </View>
  );
}

import type { DrawerContentComponentProps } from '@react-navigation/drawer';

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.navigate('Home');
  };

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem
        label="Logout"
        icon={({ color, size }: { color: string; size: number }) => <FontAwesome name="sign-out" color={color} size={size} />}
        onPress={handleLogout}
      />
    </DrawerContentScrollView>
  );
}

// Drawer Navigator Wrapper for all major features
function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props: DrawerContentComponentProps) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#33691e' },
        headerTintColor: '#fff',
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#ccc',
        drawerStyle: { backgroundColor: '#2F4F4F' },
      }}
    >
      <Drawer.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          title: 'Home',
          drawerIcon: ({ color, size }: { color: string; size: number }) => <FontAwesome name="home" color={color} size={size} />,
        }}
      />
      <Drawer.Screen name="KrishiMitra" component={KrishiMitra} />
      <Drawer.Screen name="AgroMart" component={AgroMart} />
      <Drawer.Screen name="AgroRent" component={AgroRent} />
      <Drawer.Screen name="AgriKart" component={AgriKart} />
      <Drawer.Screen name="Orders" component={Orders} />
    </Drawer.Navigator>
  );
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home">
          {(props: any) => (
            <HomeScreen
              {...props}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Main" component={DrawerNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#33691e',
    padding: 12,
    paddingLeft: 20,
  },
  headerText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 12,
    letterSpacing: 1,
  },
});
