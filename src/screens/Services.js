import React, { useState, useEffect } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { IconButton, Text, Card } from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useMyContextController } from "../store";
import auth from '@react-native-firebase/auth'; // Import Firebase Auth

const Services = () => {
  const navigation = useNavigation();
  const [controller, dispatch] = useMyContextController();
  const { userLogin } = controller;
  const userId = userLogin.id;
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  

  // Fetch data from Firestore
  useEffect(() => {
    const unsubscribe = firestore()
      .collection('RECIPES')
      .where('userId', '==', userId) // Filter by userId
      .onSnapshot((querySnapshot) => {
        const serviceList = [];
        querySnapshot.forEach((doc) => {
          serviceList.push({ id: doc.id, ...doc.data() });
        });
        setServices(serviceList);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [userId]);

  // If loading, display ActivityIndicator
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="red" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Truncate service name if longer than 24 characters
  const truncateName = (name) => {
    return name.length > 24 ? name.substring(0, 24) + '...' : name;
  };

  // Render service item
  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => goToRecipeDetail(item)}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.serviceItem}>
            <Text style={styles.serviceName}>{truncateName(item.name)}</Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const goToRecipeDetail = (item) => {
    navigation.navigate('RecipeDetail', { recipeId: item.id });
  };

  return (
    <View style={{ flex: 1 }}>
      <Image
        source={require("../asset/4.png")}
        style={{
          width: '90%',
          height: '30%',
          alignSelf: "center",
          marginVertical: 20
        }}
      />
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Danh sách Món Ăn Đã Thêm</Text>
        <IconButton
          icon="plus-circle"
          iconColor="red"
          size={40}
          onPress={() => navigation.navigate('AddRecipe')}
        />
      </View>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={{ paddingHorizontal: 16 }}
      />
    </View>
  );
};

// Define styles
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    marginTop: 10,
    color: '#999',
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#333',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  card: {
    marginVertical: 8,
    borderRadius: 8,
    elevation: 3,
    backgroundColor: '#fff',
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '500',
    flex: 1,
    color: '#333',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 10,
  },
});

export default Services;