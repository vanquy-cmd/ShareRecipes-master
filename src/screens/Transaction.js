import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Text, Button } from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const Transaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('TRANSACTIONS') // Thay đổi thành tên bảng bạn đang sử dụng
      .onSnapshot(snapshot => {
        const transactionList = [];
        snapshot.forEach(doc => {
          transactionList.push({ id: doc.id, ...doc.data() });
        });
        setTransactions(transactionList);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const handleDeleteTransaction = (id) => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "OK", onPress: () => deleteTransaction(id) }
      ]
    );
  };

  const deleteTransaction = async (id) => {
    try {
      await firestore().collection('TRANSACTIONS').doc(id).delete();
    } catch (error) {
      console.error("Error deleting transaction: ", error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.transactionItem}>
      <Text>{item.name}: {item.amount} VND</Text>
      <Button onPress={() => handleDeleteTransaction(item.id)}>Delete</Button>
    </View>
  );

  return (
    <View style={styles.container}>
      <Button 
        mode="contained" 
        onPress={() => navigation.navigate('AddTransaction')} // Đường dẫn đến màn hình thêm giao dịch
        style={styles.addButton}
      >
        Add Transaction
      </Button>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderItem}
          keyExtractor={item => item.id}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  transactionItem: {
    padding: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  addButton: {
    marginBottom: 20,
  },
});

export default Transaction;