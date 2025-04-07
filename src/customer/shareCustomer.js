import React from 'react';
import { View, Text, Share, StyleSheet, Image } from 'react-native';
import { Button, Card } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MyComponent = () => {
  const userInfo = {
    name: "Trọng Trần",
    username: "cook_110561943",
    location: "Nghệ An",
    dishes: [
      {
        name: "Uufuf",
        quantity: "100 g bột",
        volume: "10 ml nước",
      },
    ],
  };

  const shareInfo = async () => {
    try {
      await Share.share({
        message: `Chia sẻ từ ${userInfo.name} (${userInfo.username})\nMón ăn: ${userInfo.dishes[0].name}\nSố lượng: ${userInfo.dishes[0].quantity}\nThể tích: ${userInfo.dishes[0].volume}`,
      });
    } catch (error) {
      console.log('Error sharing:', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{userInfo.name}</Text>
        <Text style={styles.userHandle}>{userInfo.username}</Text>
        <Text style={styles.userLocation}>{userInfo.location}</Text>
        <Text style={styles.userStats}>1 Bạn Bếp | 0 Người quan tâm</Text>
        <Button mode="contained" onPress={shareInfo} icon="share">
          Kết Bạn Bếp
        </Button>
      </View>
      
      <View style={styles.dishesContainer}>
        <Text style={styles.dishesTitle}>Các món ({userInfo.dishes.length})</Text>
        {userInfo.dishes.map((dish, index) => (
          <Card key={index} style={styles.dishCard}>
            <Card.Content>
              <Text style={styles.dishName}>{dish.name}</Text>
              <Text>{dish.quantity}</Text>
              <Text>{dish.volume}</Text>
            </Card.Content>
          </Card>
        ))}
        <Button mode="outlined" style={styles.viewMoreButton}>
          Xem tất cả các món
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  userInfo: {
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userHandle: {
    fontSize: 18,
    color: 'gray',
  },
  userLocation: {
    fontSize: 16,
    color: 'darkgray',
  },
  userStats: {
    fontSize: 14,
    marginVertical: 10,
  },
  dishesContainer: {
    marginTop: 20,
  },
  dishesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dishCard: {
    marginVertical: 10,
    padding: 10,
  },
  dishName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewMoreButton: {
    marginTop: 10,
  },
});

export default MyComponent;