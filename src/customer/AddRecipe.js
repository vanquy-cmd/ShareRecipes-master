import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import 'react-native-get-random-values'; // Import polyfill
import { v4 as uuidv4 } from 'uuid'; // Import uuid sau
import { getFirestore, collection, doc, setDoc, serverTimestamp } from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useMyContextController } from "../store";

const AddRecipeScreen = () => {
  const navigation = useNavigation();
  const [controller, dispatch] = useMyContextController();
  const { userLogin } = controller;
  const userId = userLogin.id;
  const firestore = getFirestore();
  const RECIPES = collection(firestore, "RECIPES");
  const [ingredients, setIngredients] = useState(['']);
  const [steps, setSteps] = useState([{ text: '', image: null }]);
  const [imageUri, setImageUri] = useState(null);
  const [recipeName, setRecipeName] = useState('');
  const [meaning, setMeaning] = useState('');
  const [servings, setServings] = useState('2');
  const [cookingTime, setCookingTime] = useState('1 tiếng 30 phút');
  const [loading, setLoading] = useState(false);

  const getNextRecipeId = async () => {
    const snapshot = await getDocs(RECIPES);
    const ids = snapshot.docs.map(doc => {
      const data = doc.data();
      return data.idRecipe;  // Chỉnh sửa để lấy đúng id
    });
    const maxId = Math.max(...ids.map(id => parseInt(id.replace('@recipe_', ''))), 0);
    return `@recipe_${maxId + 1}`;
  };
  

  const addIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const addStep = () => {
    setSteps([...steps, { text: '', image: null }]);
  };

  const selectImage = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
    };
  
    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('Người dùng đã hủy chọn hình');
      } else if (response.error) {
        console.log('Lỗi ImagePicker: ', response.error);
      } else if (response.assets && response.assets.length > 0) {
        setImageUri(response.assets[0].uri); // Đảm bảo rằng uri của hình ảnh được thiết lập đúng.
      } else {
        console.log('Không có hình ảnh được chọn');
      }
    });
  };

  const saveRecipe = async () => {
    if (!recipeName || ingredients.length === 0 || steps.length === 0) {
      Alert.alert('Please fill in all fields!');
      return;
    }
  
    setLoading(true);
  
    try {
      const newId = uuidv4(); // Tạo ID duy nhất bằng UUID
  
      // Upload hình ảnh lên Firebase Storage vào thư mục riêng của user
      let imageUrl = null;
      if (imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const imageRef = storage().ref(`images/${userId}/${newId}.jpg`); // Sử dụng newId làm tên hình ảnh
        await imageRef.put(blob);
        imageUrl = await imageRef.getDownloadURL();
      }
  
      // Lưu công thức vào Firestore
      await setDoc(doc(RECIPES, newId), {
        idRecipe: newId,
        name: recipeName,
        meaning,
        servings,
        cookingTime,
        ingredients,
        steps,
        imageUri: imageUrl,
        createdAt: serverTimestamp(),
        userId,
      });
      setLoading(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error adding recipe: ', error);
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack(); // Quay lại trang trước
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={handleBackPress} />
        <View style={styles.headerButtons}>
          <IconButton icon="content-save" onPress={saveRecipe} loading={loading} disabled={loading} />
          <IconButton icon="wave" onPress={() => console.log('Lên sóng')} />
          <IconButton icon="dots-vertical" onPress={() => console.log('Thêm tùy chọn')} />
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingTop: 80 }}>
      <TouchableOpacity style={styles.imageContainer} onPress={selectImage}>
        {imageUri ? (
          <Image style={styles.image} source={{ uri: imageUri }} />
        ) : (
          <>
            <Image style={styles.image} source={{ uri: 'https://via.placeholder.com/300' }} />
            <Text style={styles.addImageText}>Thêm hình đại diện món ăn</Text>
          </>
        )}
      </TouchableOpacity>

        <TextInput style={styles.input} placeholder="Tên món ăn" value={recipeName} onChangeText={setRecipeName} />
        <TextInput style={styles.input} placeholder="Ý nghĩa khi chia sẻ món ăn" value={meaning} onChangeText={setMeaning} />
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Khẩu phần:</Text>
          <TextInput
            style={styles.numberInput}
            placeholder="2 người"
            value={servings}
            onChangeText={(text) => setServings(text || '2')} // Mặc định là 2
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Thời gian nấu:</Text>
          <TextInput
            style={styles.numberInput}
            placeholder="1 tiếng 30 phút"
            value={cookingTime}
            onChangeText={(text) => setCookingTime(text || '1 tiếng 30 phút')} // Mặc định là 1 tiếng 30 phút
          />
        </View>

        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Nguyên liệu:</Text>
        {ingredients.map((ingredient, index) => (
          <View style={styles.ingredientContainer} key={index}>
            <Icon name="reorder" size={24} color="black" style={styles.icon} />
            <TextInput
              style={styles.ingredientInput}
              placeholder={`Nguyên liệu ${index + 1}`}
              value={ingredient}
              onChangeText={(text) => {
                const newIngredients = [...ingredients];
                newIngredients[index] = text;
                setIngredients(newIngredients);
              }}
            />
            <Icon
              name="more-vert"
              size={24}
              color="black"
              style={styles.icon}
              onPress={() => {
                Alert.alert(
                  'Xóa nguyên liệu',
                  'Bạn có chắc chắn muốn xóa nguyên liệu này?',
                  [
                    { text: 'Hủy', style: 'cancel' },
                    {
                      text: 'Xóa',
                      onPress: () => {
                        const newIngredients = ingredients.filter((_, i) => i !== index);
                        setIngredients(newIngredients);
                      },
                    },
                  ],
                  { cancelable: true }
                );
              }}
            />
          </View>
        ))}
        <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
          <Text style={styles.addButtonText}>+ Thêm nguyên liệu</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Cách làm:</Text>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={styles.iconContainer}>
                <View style={styles.numberContainer}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Icon name="reorder" size={24} color="black" />
              </View>

              <TextInput
                style={styles.stepInput}
                placeholder={`Bước ${index + 1}`}
                value={step.text}
                onChangeText={(text) => {
                  const newSteps = [...steps];
                  newSteps[index].text = text;
                  setSteps(newSteps);
                }}
              />
              <Icon
                name="more-vert"
                size={24}
                color="black"
                onPress={() => {
                  Alert.alert(
                    'Xóa bước',
                    'Bạn có chắc chắn muốn xóa bước này?',
                    [
                      { text: 'Hủy', style: 'cancel' },
                      {
                        text: 'Xóa',
                        onPress: () => {
                          const newSteps = steps.filter((_, i) => i !== index);
                          setSteps(newSteps);
                        },
                      },
                    ],
                    { cancelable: true }
                  );
                }}
              />
            </View>
            <TouchableOpacity style={styles.imageButton} onPress={selectImage}>
              <Icon name="photo-camera" size={24} color="white" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addStep}>
          <Text style={styles.addButtonText}>+ Thêm bước</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute', // Giữ header ở trên cùng
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10, // Đảm bảo rằng header nằm trên các phần tử khác
    backgroundColor: '#fff', // Màu nền cho header
    padding: 16, // Padding cho header
  },
  headerButtons: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: '100%', // Chiếm toàn bộ chiều rộng
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#1E1E1E',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  addImageText: {
    marginTop: 8,
    color: '#fff',
    textAlign: 'center',
  },

  // Input và nhãn
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    justifyContent: 'space-between',
  },
  label: {
    color: '#000', // Đổi màu chữ nhãn thành đen cho dễ nhìn
    flex: 1,
    marginRight: 10,
    textAlign: 'left',
    fontSize: 18, // Kích thước chữ lớn hơn
  },
  numberInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
    color: '#000',
    fontSize: 18, // Kích thước chữ lớn hơn
  },

  // Các trường nhập khác
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
    backgroundColor: '#fff', // Màu nền trắng cho các trường nhập khác
    color: '#000', // Màu chữ đen
    fontSize: 18, // Kích thước chữ lớn hơn
  },
  ingredientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  ingredientInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
    backgroundColor: '#fff',
    color: '#000',
  },
  stepContainer: {
    marginVertical: 8,
  },
  stepInput: {
    flex: 1, // Cho phép TextInput chiếm không gian còn lại
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#fff',
    color: '#000',
    marginRight: 8, // Khoảng cách giữa icon và TextInput
  },

  // Nút bấm
  addButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#ff9932',
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
///////////////
  icon: {
    paddingHorizontal: 8,
  },

  ///////////////////
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Khoảng cách giữa tiêu đề và ô nhập
  },
  
  numberContainer: {
    backgroundColor: 'black',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute', // Để định vị số ở trên cùng
    top: -25, // Điều chỉnh vị trí số
    left: 2, // Điều chỉnh vị trí số
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8, // Khoảng cách giữa icon và TextInput
    position: 'relative', // Để cho phép định vị số
  },
  
  stepNumber: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Căn giữa nội dung
    backgroundColor: '#ff9932',
    borderRadius: 8,
    paddingVertical: 10,  // Điều chỉnh padding trên và dưới
    paddingHorizontal: 15, // Điều chỉnh padding trái và phải
    marginTop: 8,
    marginLeft: 30,
    width: '30%',         // Đặt độ rộng theo ý muốn, ví dụ 100% để chiếm toàn bộ chiều rộng
    height: 80,            // Đặt chiều cao tùy ý
  },
  
  imageButtonText: {
    color: '#fff',
    marginLeft: 8,
  },
});

export default AddRecipeScreen;