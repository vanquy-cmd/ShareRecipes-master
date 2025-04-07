import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { SwipeListView } from 'react-native-swipe-list-view';
import firestore from '@react-native-firebase/firestore';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openRow, setOpenRow] = useState(null); // Trạng thái hàng đang mở

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('USERS')
      .onSnapshot((querySnapshot) => {
        const userList = [];
        querySnapshot.forEach((doc) => {
          const userData = { id: doc.id, ...doc.data() };
          if (userData.role !== 'admin') {
            userList.push(userData);
          }
        });
        setUsers(userList);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const deleteUser = (id) => {
    firestore()
      .collection('USERS')
      .doc(id)
      .delete()
      .then(() => {
        Alert.alert("Xóa thành công", "Người dùng đã được xóa.");
      })
      .catch((error) => {
        console.error("Error removing document: ", error);
      });
  };

  const renderHiddenItem = (data, rowMap) => (
    <View style={styles.hiddenContainer}>
      <TouchableOpacity
        style={[styles.backButton, styles.editButton]}
        onPress={() => Alert.alert("Chỉnh sửa", "Chức năng chỉnh sửa chưa được cài đặt")}
      >
        <Text style={styles.backText}>Chỉnh sửa</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.backButton, styles.deleteButton]}
        onPress={() => deleteUser(data.item.id)}
      >
        <Text style={styles.backText}>Xóa</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.backButton, styles.viewButton]}
        onPress={() => Alert.alert("Thông tin người dùng", "Chức năng xem thông tin chưa được cài đặt")}
      >
        <Text style={styles.backText}>Xem</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Danh sách người dùng</Text>
      <SwipeListView
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.userName}>{item.fullName}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>
            </Card.Content>
          </Card>
        )}
        renderHiddenItem={renderHiddenItem}
        leftOpenValue={150}
        rightOpenValue={-150}
        disableLeftSwipe={false}
        disableRightSwipe={true}
        onRowOpen={(rowKey, rowMap) => {
          // Đóng hàng nếu có hàng khác đang mở
          if (openRow && openRow !== rowKey && rowMap[openRow]) {
            rowMap[openRow].closeRow();
          }
          setOpenRow(rowKey); // Đặt hàng hiện tại là hàng mở
        }}
        onRowClose={() => setOpenRow(null)} // Đặt trạng thái trở về khi đóng
      />
    </View>
  );
};

// Định dạng style
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 18,
    marginTop: 10,
    color: '#999',
  },
  card: {
    marginVertical: 8,
    borderRadius: 10,
    elevation: 4,
    backgroundColor: '#fff',
    padding: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  hiddenContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#ddd',
    paddingLeft: 10,
    flex: 1,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 85, // Đặt chiều rộng cho nút
    height: '86%',
    borderRadius: 10,
    padding: 10, // Thêm padding để nút có không gian
  },
  editButton: {
    backgroundColor: '#FFC107',
  },
  deleteButton: {
    backgroundColor: '#D32F2F',
  },
  viewButton: {
    backgroundColor: '#4CAF50',
  },
  backText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default UserList;