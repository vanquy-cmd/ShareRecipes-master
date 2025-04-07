import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  ActivityIndicator,
  Dimensions,
  Animated,
  StatusBar
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const DetectIngredient = () => {
  const navigation = useNavigation();
  const [imageUri, setImageUri] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedDish, setSelectedDish] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const apiKey = "AIzaSyAJ2bcbeRGkJfwovx9pKLw293xHduigyYI";
  const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
    
    // Start pulse animation for analyze button
    startPulseAnimation();
  }, []);
  
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setSuggestions([]);
      setSelectedDish(null);
      
      // Animate the new image
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setSuggestions([]);
      setSelectedDish(null);
      
      // Animate the new image
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
    }
  };

  const analyzeImage = async () => {
    if (!imageUri) {
      alert("Vui lòng chọn hoặc chụp ảnh nguyên liệu!");
      return;
    }

    setLoading(true);
    setAnalyzing(true);

    const base64ImageData = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const requestData = {
      contents: [
        {
          parts: [
            {
              text: "Nhận diện nguyên liệu trong ảnh và đề xuất công thức món ăn phù hợp. Liệt kê các món ăn theo định dạng số (1., 2., 3., v.v.) thay vì dùng dấu sao (**)",
            },
            { inlineData: { mimeType: "image/jpeg", data: base64ImageData } },
          ],
        },
      ],
    };

    try {
      const apiResponse = await axios.post(apiURL, requestData, {
        headers: { "Content-Type": "application/json" },
      });

      const responseText = apiResponse.data.candidates[0]?.content?.parts[0]?.text || "Không tìm thấy gợi ý.";

      // Xử lý phản hồi để trích xuất các món ăn
      const lines = responseText
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item);
      const processedSuggestions = [];

      for (const line of lines) {
        // Tìm các dòng bắt đầu bằng số và dấu chấm (ví dụ: "1.", "2.")
        const match = line.match(/^\d+\.\s*(.*)/);
        if (match) {
          processedSuggestions.push(match[1]);
        } else if (
          !line.startsWith("*") &&
          !line.includes(":**") &&
          !line.includes("Dưới đây") &&
          !line.includes("Hình ảnh")
        ) {
          // Bao gồm các dòng không bắt đầu bằng * và không chứa :** (tiêu đề phần)
          // Loại bỏ các dòng giới thiệu như "Dưới đây là..." hoặc "Hình ảnh hiển thị..."
          processedSuggestions.push(line);
        }
      }

      setSuggestions(processedSuggestions);
    } catch (error) {
      console.error("Error analyzing image", error);
      alert(`Lỗi: ${error.response?.data?.error?.message || "Có lỗi xảy ra"}`);
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const fetchRecipeDetails = async (dishName) => {
    setLoading(true);
    const promptText = `Cung cấp công thức chi tiết cho món ăn ${dishName}. Bao gồm: Nguyên liệu (liệt kê rõ số lượng), Cách làm (các bước chi tiết), Mẹo nấu ăn (nếu có).`;
    const requestData = { contents: [{ parts: [{ text: promptText }] }] };

    try {
      const response = await axios.post(apiURL, requestData, {
        headers: { "Content-Type": "application/json" },
      });

      const recipeText = response.data.candidates[0]?.content?.parts[0]?.text || "Không tìm thấy công thức.";
      setSelectedDish({ name: dishName, recipe: recipeText });
    } catch (error) {
      console.error("Error fetching recipe", error);
      alert("Lỗi khi lấy công thức món ăn.");
    } finally {
      setLoading(false);
    }
  };

  const renderImagePlaceholder = () => (
    <View style={styles.imagePlaceholder}>
      <Icon name="image" size={80} color="#FFFFFF" style={{ opacity: 0.7 }} />
      <Text style={styles.placeholderText}>Chọn hoặc chụp ảnh nguyên liệu</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <ImageBackground 
        source={require("./asset/4.png")} 
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        >
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={styles.keyboardAvoidingView}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent} 
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Animated.View 
                style={[
                  styles.headerContainer, 
                  { 
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <Text style={styles.title}>Phát hiện nguyên liệu</Text>
                <Text style={styles.subtitle}>Chụp ảnh nguyên liệu để nhận gợi ý món ăn</Text>
              </Animated.View>

              <Animated.View 
                style={[
                  styles.contentContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                {imageUri ? (
                  <Animated.View style={{ opacity: fadeAnim }}>
                    <Image source={{ uri: imageUri }} style={styles.image} />
                  </Animated.View>
                ) : (
                  renderImagePlaceholder()
                )}

                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    onPress={pickImage} 
                    style={styles.button}
                    activeOpacity={0.8}
                  >
                    <Icon name="photo-library" size={22} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Thư viện</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={takePhoto} 
                    style={styles.button}
                    activeOpacity={0.8}
                  >
                    <Icon name="camera-alt" size={22} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Chụp ảnh</Text>
                  </TouchableOpacity>
                </View>

                <Animated.View style={{
                  transform: [{ scale: imageUri ? pulseAnim : 1 }]
                }}>
                  <TouchableOpacity 
                    onPress={analyzeImage} 
                    style={[
                      styles.analyzeButton,
                      analyzing && styles.analyzingButton
                    ]}
                    activeOpacity={0.8}
                    disabled={analyzing || !imageUri}
                  >
                    {analyzing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Icon name="search" size={22} color="#FFFFFF" />
                        <Text style={styles.analyzeButtonText}>
                          {imageUri ? "Phân tích nguyên liệu" : "Chọn ảnh để phân tích"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {loading && !analyzing && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF6B00" />
                    <Text style={styles.loadingText}>Đang xử lý...</Text>
                  </View>
                )}

                {suggestions.length > 0 && !selectedDish && (
                  <View style={styles.suggestionContainer}>
                    <View style={styles.suggestionHeader}>
                      <Icon name="restaurant" size={24} color="#FF6B00" />
                      <Text style={styles.suggestionTitle}>Gợi ý món ăn</Text>
                    </View>
                    
                    {suggestions.map((item, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.dishItem} 
                        onPress={() => fetchRecipeDetails(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dishNumber}>{index + 1}</Text>
                        <Text style={styles.dishText}>{item}</Text>
                        <Icon name="chevron-right" size={24} color="#FF6B00" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {selectedDish && (
                  <View style={styles.recipeContainer}>
                    <View style={styles.recipeHeader}>
                      <Text style={styles.recipeTitle}>{selectedDish.name}</Text>
                      <TouchableOpacity 
                        onPress={() => setSelectedDish(null)} 
                        style={styles.closeButton}
                      >
                        <Icon name="close" size={24} color="#777" />
                      </TouchableOpacity>
                    </View>
                    
                    <ScrollView 
                      style={styles.recipeScrollView}
                      showsVerticalScrollIndicator={false}
                    >
                      <Text style={styles.recipeText}>{selectedDish.recipe}</Text>
                    </ScrollView>
                    
                    <TouchableOpacity 
                      onPress={() => setSelectedDish(null)} 
                      style={styles.backToListButton}
                      activeOpacity={0.8}
                    >
                      <Icon name="arrow-back" size={20} color="#FFFFFF" />
                      <Text style={styles.backToListText}>Quay lại danh sách món</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    paddingTop: 50,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
  },
  imagePlaceholder: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  placeholderText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#FF6B00',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  analyzeButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  analyzingButton: {
    backgroundColor: '#FF8F3F',
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  suggestionContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 10,
  },
  suggestionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  dishItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  dishNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B00',
    marginRight: 10,
    width: 25,
  },
  dishText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  recipeContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    maxHeight: height * 0.6,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 10,
    marginBottom: 15,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B00',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  recipeScrollView: {
    maxHeight: height * 0.4,
  },
  recipeText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  backToListButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backToListText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default DetectIngredient;