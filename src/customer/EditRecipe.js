import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert,
  ActivityIndicator,
  StatusBar,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { IconButton, Divider } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const { width, height } = Dimensions.get('window');

const EditRecipe = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const RECIPES = firestore().collection("RECIPES");
  const { recipeId } = route.params;
  
  const [ingredients, setIngredients] = useState(['', '']);
  const [steps, setSteps] = useState([{ text: '', image: null }, { text: '', image: null }]);
  const [imageUri, setImageUri] = useState(null);
  const [recipeName, setRecipeName] = useState('');
  const [meaning, setMeaning] = useState('');
  const [servings, setServings] = useState('');
  const [cookingTime, setCookingTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('basic');
  const [hasChanges, setHasChanges] = useState(false);
  
  const scrollViewRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Animation values
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const recipeDoc = await RECIPES.doc(recipeId).get();
        if (recipeDoc.exists) {
          const recipeData = recipeDoc.data();
          setRecipeName(recipeData.name || '');
          setMeaning(recipeData.meaning || '');
          setServings(recipeData.servings || '');
          setCookingTime(recipeData.cookingTime || '');
          setIngredients(recipeData.ingredients || ['', '']);
          
          // Ensure steps have the correct format
          if (recipeData.steps && recipeData.steps.length > 0) {
            const formattedSteps = recipeData.steps.map(step => {
              if (typeof step === 'string') {
                return { text: step, image: null };
              } else if (typeof step === 'object') {
                return { 
                  text: step.text || '', 
                  image: step.image || null 
                };
              }
              return { text: '', image: null };
            });
            setSteps(formattedSteps);
          }
          
          setImageUri(recipeData.imageUri || null);
        }
        setInitialLoading(false);
      } catch (error) {
        console.error('Error fetching recipe:', error);
        setInitialLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId]);
  
  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [recipeName, meaning, servings, cookingTime, ingredients, steps, imageUri]);

  const selectImage = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      quality: 0.8,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.assets && response.assets.length > 0) {
        setImageUri(response.assets[0].uri);
      }
    });
  };
  
  const selectStepImage = (index) => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      quality: 0.8,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.assets && response.assets.length > 0) {
        const newSteps = [...steps];
        newSteps[index].image = response.assets[0].uri;
        setSteps(newSteps);
      }
    });
  };

  const saveRecipe = async () => {
    const userId = auth().currentUser?.uid;

    if (!userId) {
      Alert.alert('Lỗi', 'Bạn cần đăng nhập để lưu công thức.');
      return;
    }
    
    if (!recipeName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên món ăn.');
      return;
    }
    
    // Filter out empty ingredients and steps
    const filteredIngredients = ingredients.filter(item => item.trim() !== '');
    const filteredSteps = steps.filter(step => step.text.trim() !== '');
    
    if (filteredIngredients.length === 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập ít nhất một nguyên liệu.');
      return;
    }
    
    if (filteredSteps.length === 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập ít nhất một bước thực hiện.');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = imageUri;

      // Upload main image if it's a local URI (starts with 'file://')
      if (imageUri && imageUri.startsWith('file://')) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const imageRef = storage().ref(`images/${userId}/${recipeId}_main.jpg`);
        await imageRef.put(blob);
        imageUrl = await imageRef.getDownloadURL();
      }
      
      // Upload step images if they are local URIs
      const updatedSteps = await Promise.all(
        filteredSteps.map(async (step, index) => {
          let stepImageUrl = step.image;
          
          if (step.image && step.image.startsWith('file://')) {
            const response = await fetch(step.image);
            const blob = await response.blob();
            const stepImageRef = storage().ref(`images/${userId}/${recipeId}_step_${index}.jpg`);
            await stepImageRef.put(blob);
            stepImageUrl = await stepImageRef.getDownloadURL();
          }
          
          return {
            ...step,
            image: stepImageUrl
          };
        })
      );

      await RECIPES.doc(recipeId).update({
        name: recipeName.trim(),
        meaning: meaning.trim(),
        servings: servings.trim(),
        cookingTime: cookingTime.trim(),
        ingredients: filteredIngredients,
        steps: updatedSteps,
        imageUri: imageUrl,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      
      setHasChanges(false);
      setLoading(false);
      
      Alert.alert(
        'Thành công',
        'Công thức đã được cập nhật thành công!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error updating recipe: ', error);
      setLoading(false);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi cập nhật công thức. Vui lòng thử lại sau.');
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, '']);
  };
  
  const addStep = () => {
    setSteps([...steps, { text: '', image: null }]);
  };
  
  const confirmDeleteIngredient = (index) => {
    if (ingredients.length <= 1) {
      Alert.alert('Không thể xóa', 'Công thức cần có ít nhất một nguyên liệu.');
      return;
    }
    
    Alert.alert(
      'Xóa nguyên liệu',
      'Bạn có chắc chắn muốn xóa nguyên liệu này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            const newIngredients = ingredients.filter((_, i) => i !== index);
            setIngredients(newIngredients);
          },
        },
      ]
    );
  };
  
  const confirmDeleteStep = (index) => {
    if (steps.length <= 1) {
      Alert.alert('Không thể xóa', 'Công thức cần có ít nhất một bước thực hiện.');
      return;
    }
    
    Alert.alert(
      'Xóa bước',
      'Bạn có chắc chắn muốn xóa bước này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            const newSteps = steps.filter((_, i) => i !== index);
            setSteps(newSteps);
          },
        },
      ]
    );
  };
  
  const confirmDiscardChanges = () => {
    if (hasChanges) {
      Alert.alert(
        'Hủy thay đổi',
        'Bạn có những thay đổi chưa lưu. Bạn có chắc chắn muốn thoát?',
        [
          { text: 'Ở lại', style: 'cancel' },
          { text: 'Thoát', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  };
  
  const scrollToSection = (section) => {
    setActiveSection(section);
    
    if (scrollViewRef.current) {
      let yOffset = 0;
      
      switch(section) {
        case 'basic':
          yOffset = 0;
          break;
        case 'ingredients':
          yOffset = 400;
          break;
        case 'steps':
          yOffset = 600;
          break;
      }
      
      scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Đang tải công thức...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar backgroundColor="transparent" translucent barStyle="dark-content" />
      
      {/* Header with blur effect */}
      <Animated.View style={[styles.headerBlur, { opacity: headerOpacity }]}>
        <BlurView
          style={styles.absolute}
          blurType="light"
          blurAmount={20}
        />
      </Animated.View>
      
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={confirmDiscardChanges}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Chỉnh sửa công thức</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={saveRecipe}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Icon name="save" size={16} color="#FFF" />
                <Text style={styles.saveButtonText}>Lưu</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeSection === 'basic' && styles.activeTab]}
          onPress={() => scrollToSection('basic')}
        >
          <Icon 
            name="info-outline" 
            size={20} 
            color={activeSection === 'basic' ? "#FF6B00" : "#777"} 
          />
          <Text style={[styles.tabText, activeSection === 'basic' && styles.activeTabText]}>
            Cơ bản
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeSection === 'ingredients' && styles.activeTab]}
          onPress={() => scrollToSection('ingredients')}
        >
          <Icon 
            name="restaurant" 
            size={20} 
            color={activeSection === 'ingredients' ? "#FF6B00" : "#777"} 
          />
          <Text style={[styles.tabText, activeSection === 'ingredients' && styles.activeTabText]}>
            Nguyên liệu
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeSection === 'steps' && styles.activeTab]}
          onPress={() => scrollToSection('steps')}
        >
          <Icon 
            name="format-list-numbered" 
            size={20} 
            color={activeSection === 'steps' ? "#FF6B00" : "#777"} 
          />
          <Text style={[styles.tabText, activeSection === 'steps' && styles.activeTabText]}>
            Các bước
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Basic Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="info-outline" size={22} color="#FF6B00" />
            <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.imageContainer} 
            onPress={selectImage}
            activeOpacity={0.9}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.recipeImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Icon name="add-photo-alternate" size={40} color="#FFF" />
                <Text style={styles.placeholderText}>Thêm hình ảnh món ăn</Text>
              </View>
            )}
            <View style={styles.imageOverlay}>
              <Icon name="photo-camera" size={24} color="#FFF" />
              <Text style={styles.imageOverlayText}>Thay đổi ảnh</Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tên món ăn</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập tên món ăn"
              value={recipeName}
              onChangeText={setRecipeName}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ý nghĩa món ăn</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              placeholder="Chia sẻ ý nghĩa hoặc câu chuyện về món ăn này"
              value={meaning}
              onChangeText={setMeaning}
              multiline
              numberOfLines={3}
            />
          </View>
          
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Khẩu phần</Text>
              <View style={styles.inputWithIcon}>
                <Icon name="people" size={20} color="#777" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { paddingLeft: 36 }]}
                  placeholder="2 người"
                  value={servings}
                  onChangeText={setServings}
                />
              </View>
            </View>
            
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Thời gian nấu</Text>
              <View style={styles.inputWithIcon}>
                <Icon name="timer" size={20} color="#777" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { paddingLeft: 36 }]}
                  placeholder="30 phút"
                  value={cookingTime}
                  onChangeText={setCookingTime}
                />
              </View>
            </View>
          </View>
        </View>
        
        {/* Ingredients Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="restaurant" size={22} color="#FF6B00" />
            <Text style={styles.sectionTitle}>Nguyên liệu</Text>
          </View>
          
          {ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientItem}>
              <View style={styles.ingredientDragHandle}>
                <Icon name="drag-handle" size={20} color="#CCC" />
              </View>
              
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
              
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => confirmDeleteIngredient(index)}
                activeOpacity={0.7}
              >
                <Icon name="delete-outline" size={20} color="#FF6B00" />
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={addIngredient}
            activeOpacity={0.8}
          >
            <Icon name="add" size={20} color="#FFF" />
            <Text style={styles.addButtonText}>Thêm nguyên liệu</Text>
          </TouchableOpacity>
        </View>
        
        {/* Steps Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="format-list-numbered" size={22} color="#FF6B00" />
            <Text style={styles.sectionTitle}>Các bước thực hiện</Text>
          </View>
          
          {steps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                </View>
                
                <View style={styles.stepDragHandle}>
                  <Icon name="drag-handle" size={20} color="#CCC" />
                </View>
                
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => confirmDeleteStep(index)}
                  activeOpacity={0.7}
                >
                  <Icon name="delete-outline" size={20} color="#FF6B00" />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.stepInput}
                placeholder={`Mô tả bước ${index + 1}`}
                value={step.text}
                onChangeText={(text) => {
                  const newSteps = [...steps];
                  newSteps[index].text = text;
                  setSteps(newSteps);
                }}
                multiline
                numberOfLines={3}
              />
              
              <TouchableOpacity 
                style={styles.stepImageContainer}
                onPress={() => selectStepImage(index)}
                activeOpacity={0.9}
              >
                {step.image ? (
                  <Image source={{ uri: step.image }} style={styles.stepImage} />
                ) : (
                  <View style={styles.stepImagePlaceholder}>
                    <Icon name="add-photo-alternate" size={24} color="#777" />
                    <Text style={styles.stepImagePlaceholderText}>Thêm hình ảnh</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={addStep}
            activeOpacity={0.8}
          >
            <Icon name="add" size={20} color="#FFF" />
            <Text style={styles.addButtonText}>Thêm bước</Text>
          </TouchableOpacity>
        </View>
        
        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    zIndex: 1,
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    zIndex: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    zIndex: 2,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#FFF0E6',
  },
  tabText: {
    fontSize: 14,
    color: '#777',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#FF6B00',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  section: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#777',
    marginTop: 8,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  imageOverlayText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputWithIcon: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ingredientDragHandle: {
    padding: 8,
  },
  ingredientInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  deleteButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  stepItem: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FAFAFA',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumberContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  stepNumber: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepDragHandle: {
    flex: 1,
    paddingHorizontal: 8,
  },
  stepInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  stepImageContainer: {
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  stepImage: {
    width: '100%',
    height: '100%',
  },
  stepImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepImagePlaceholderText: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  bottomSpacing: {
    height: 80,
  },
});

export default EditRecipe;