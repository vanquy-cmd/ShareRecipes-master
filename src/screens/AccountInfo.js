import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Alert, TouchableOpacity, ActivityIndicator, ImageBackground } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { launchImageLibrary } from 'react-native-image-picker';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useMyContextController } from "../store";

const AccountInfo = ({ route }) => {
  const navigation = useNavigation();
  const [controller, dispatch] = useMyContextController();
  const { userLogin } = controller;
  const userId = userLogin.id;
  const defaultAvatar = 'https://via.placeholder.com/100/FFFFFF/000000?text=No+Image';
  const { userInfo } = route.params;
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editedInfo, setEditedInfo] = useState({});

  useEffect(() => {
    const unsubscribe = firestore()
        .collection('USERS')
        .doc(userId)
        .onSnapshot(userDoc => {
            if (userDoc.exists) {
                const data = userDoc.data();
                setEditedInfo(data);
                setImageUri(data.imageUri);
                setLoading(false);
            } else {
                console.log('No such document!');
                setLoading(false);
            }
        }, error => {
            console.error(error);
            setLoading(false);
        });

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
      return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (!userInfo) {
      return <Text>Không tìm thấy thông tin người dùng.</Text>;
  }

  const handleImagePress = () => {
    Alert.alert(
      "Hình ảnh",
      "Chọn một tùy chọn",
      [
        {
          text: "Xem hình ảnh",
          onPress: () => viewImage(),
        },
        {
          text: "Thay đổi hình ảnh",
          onPress: selectImage,
        },
        {
          text: "Chỉnh sửa thông tin",
          onPress: () => navigation.navigate('EditInfoCustomer', { userInfo: userLogin }) ,
        },
        { text: "Hủy", style: "cancel" }
      ]
    );
  };

  const selectImage = () => {
    const options = {
        mediaType: 'photo',
        includeBase64: false,
    };

    launchImageLibrary(options, (response) => {
        if (response.didCancel) {
            console.log('User cancelled image picker');
        } else if (response.error) {
            console.log('ImagePicker Error: ', response.error);
        } else {
            setImageUri(response.assets[0].uri);
        }
    });
  };

  const viewImage = () => {
    if (imageUri) {
      navigation.navigate('ImageViewerScreen', { imageUri });
    } else {
      Alert.alert(
        "Thông báo",
        "Không có hình ảnh để xem.",
        [
          {
            text: "OK",
            onPress: () => console.log("Đóng thông báo"),
            style: "cancel"
          }
        ],
        { cancelable: true }
      );
    }
  };

  return (
    <ImageBackground 
      source={require('../asset/4.png')} 
      style={styles.background}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Card style={styles.card}>
            <TouchableOpacity onPress={handleImagePress} style={styles.avatarContainer}>
              <Image 
                source={imageUri ? { uri: imageUri } : { uri: defaultAvatar }} 
                style={styles.avatar} 
              />
            </TouchableOpacity>
            <Card.Content style={styles.content}>
              <Text style={styles.fullName}>Họ tên: {editedInfo.fullName}</Text>
              <Text style={styles.email}>Email: {editedInfo.email}</Text>
              <Text style={styles.address}>Địa chỉ: {editedInfo.address}</Text>
              <Text style={styles.phone}>Số điện thoại: {editedInfo.phone}</Text>
            </Card.Content>
          </Card>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Độ mờ của overlay
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // Độ trong suốt của container
    padding: 20,
    elevation: 5, // Đổ bóng nhẹ
  },
  card: {
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    elevation: 3,
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center', // Căn giữa nội dung
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#007BFF',
  },
  content: {
    alignItems: 'flex-start', // Căn giữa nội dung bên trong card
  },
  email: {
    fontSize: 18,
    color: '#333',
    marginVertical: 5,
  },
  fullName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  address: {
    fontSize: 18,
    color: '#333',
    marginVertical: 5,
  },
  phone: {
    fontSize: 18,
    color: '#333',
    marginVertical: 5,
  },
});

export default AccountInfo;