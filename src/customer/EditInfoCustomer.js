import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, TextInput  } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { useMyContextController } from "../store";

const EditInfoCustomer = () => {
    const navigation = useNavigation();
    const [controller, dispatch] = useMyContextController();
    const { userLogin } = controller;
    const userId = userLogin.id;
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true); // Thêm trạng thái loading
    const [editedInfo, setEditedInfo] = useState({}); // State để lưu thông tin chỉnh sửa
    const [imageUri, setImageUri] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userDoc = await firestore().collection('USERS').doc(userId).get();
                if (userDoc.exists) {
                    const data = userDoc.data();
                    setUserInfo(data);
                    setEditedInfo(data); // Khởi tạo thông tin chỉnh sửa với dữ liệu hiện tại
                    setImageUri(data.imageUri);
                } else {
                    console.log('No such document!');
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false); // Đặt loading thành false sau khi hoàn thành
            }
        };

        fetchUserData();
    }, []);
    

    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" />; // Hiển thị loading indicator
    }

    if (!userInfo) {
        return <Text>Không tìm thấy thông tin người dùng.</Text>; // Thông báo nếu không có dữ liệu
    }

    const selectImage = () => {
        const options = {
            mediaType: 'photo',
            includeBase64: false,
        };
    
        launchImageLibrary(options, async (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else {
                // Upload image to Firebase Storage
                const fileUri = response.assets[0].uri;
                const fileName = `images/${userId}/${new Date().getTime()}.jpg`; // Tạo một tên file duy nhất
                const reference = storage().ref(fileName);
                
                try {
                    await reference.putFile(fileUri); // Tải file lên
                    const imageUrl = await reference.getDownloadURL(); // Lấy URL của file
                    setImageUri(imageUrl); // Lưu URL hình ảnh để hiển thị
                } catch (error) {
                    console.log('Upload image error: ', error);
                }
            }
        });
    };
    
    const handleUpdate = async () => {
        try {
            await firestore().collection('USERS').doc(userId).update({ ...editedInfo, imageUri });
            console.log('Thông tin đã được cập nhật!');
            navigation.goBack(); // Quay lại sau khi cập nhật
        } catch (error) {
            console.error('Cập nhật thất bại: ', error);
        }
    };

    const handleBackPress = () => {
        navigation.goBack(); // Quay lại trang trước
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}> 
                <View style={styles.headerButtons}>
                    <IconButton icon="arrow-left" onPress={handleBackPress} />
                    <View style={styles.spacer} />
                    <TouchableOpacity
                        style={styles.updateButton}
                        onPress={handleUpdate}
                    >
                        <Text style={styles.buttonText}>Cập nhật</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.headerIndividual}>
                <TouchableOpacity onPress={selectImage}>
                    <Image
                        source={{ uri: imageUri || userInfo.imageUri }}
                        style={styles.avatar}
                    />
                </TouchableOpacity>
                <View style={styles.nameContainer}>
                    <Text style={styles.name}>{userInfo.fullName}</Text>
                    <Text style={styles.info}>{userInfo.id}</Text>
                </View>
            </View>

            <View style={styles.infoContainer}>
                <View style={styles.noActivity}>
                    <Text style={styles.label}>Tên</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={editedInfo.fullName}
                            onChangeText={text => setEditedInfo({ ...editedInfo, fullName: text })}
                        />
                        <View style={styles.underline} />
                    </View>
                    

                    <Text style={styles.label}>Email</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={editedInfo.email}
                            onChangeText={text => setEditedInfo({ ...editedInfo, email: text })}
                        />
                        <View style={styles.underline} />
                    </View>
                        

                    <Text style={styles.label}>Đến từ</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={editedInfo.address}
                            onChangeText={text => setEditedInfo({ ...editedInfo, address: text })}
                        />
                        <View style={styles.underline} />
                    </View>
                        

                    <Text style={styles.label}>Số điện Thoại</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={editedInfo.phone}
                            onChangeText={text => setEditedInfo({ ...editedInfo, phone: text })}
                        />
                        <View style={styles.underline} />
                    </View>
                        
                    <Text style={styles.label}>Mô tả</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={editedInfo.describe}
                            onChangeText={text => setEditedInfo({ ...editedInfo, describe: text })}
                            multiline // Cho phép nhập nhiều dòng
                            placeholder="Vài dòng về bạn và đam mê nấu nướng" // Chữ gợi ý
                            placeholderTextColor="#999" // Màu cho chữ gợi ý
                        />
                        <View style={styles.underline} />
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'stretch',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1, // Để headerButtons chiếm không gian
    },
    spacer: {
        flex: 1, // Spacer sẽ chiếm không gian giữa hai icon
    },
    updateButton: {
        width: '30%',
        alignSelf: 'center',
        backgroundColor: '#ff9932', // Màu nền cho nút
        borderRadius: 12, // Bo tròn nút
        padding: 10, // Padding cho nút
        alignItems: 'center', // Căn giữa nội dung nút
    },
    buttonText: {
        color: 'black', // Màu chữ
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerIndividual: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nameContainer: {
        marginLeft: 10,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 5,
    },
    username: {
        fontSize: 16,
        color: '#888',
    },
    infoContainer: {
        backgroundColor: '#f8f6f2',
        width: '100%', // Đảm bảo content chiếm hết chiều rộng
        height: '100%',
        marginTop: 10,
        marginBottom: 20,
    },
    noActivity: {
        padding: 10,
    },
    label: {
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 5,
    },
    info: {
        fontSize: 20,
        marginBottom: 15,
    },
    inputContainer: {
        marginBottom: 15,
    },
    input: {
        fontSize: 19,
        borderWidth: 0, // Ẩn viền của TextInput
        padding: 8,
    },
    underline: {
        height: 1,
        backgroundColor: '#ccc', // Màu gạch dưới
        marginTop: 2,
    },
});

export default EditInfoCustomer;