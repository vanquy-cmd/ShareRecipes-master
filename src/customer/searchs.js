import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableWithoutFeedback, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  PanResponder, 
  ImageBackground,
  StatusBar,
  Dimensions
} from 'react-native';
import { TextInput, IconButton, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useMyContextController } from "../store";
import { getFirestore, collection, doc, onSnapshot, getDoc, setDoc, updateDoc } from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.42;

const SearchScreen = () => {
  const [controller] = useMyContextController();
  const { userLogin } = controller;
  const userId = userLogin.id;
  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(-330)).current;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [popularIngredients, setPopularIngredients] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentDishes, setRecentDishes] = useState([]);
  const [categories, setCategories] = useState(['Tất cả', 'Món chính', 'Món phụ', 'Tráng miệng', 'Đồ uống']);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const firestore = getFirestore();
    
    // Lắng nghe thay đổi thông tin người dùng
    const unsubscribeUser = onSnapshot(doc(firestore, 'USERS', userId), (userDoc) => {
      if (userDoc.exists) {
        setUserInfo(userDoc.data());
      } else {
        console.log('Không tìm thấy tài liệu!');
      }
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });
  
    // Lắng nghe thay đổi cho nguyên liệu phổ biến
    const unsubscribeRecipes = onSnapshot(collection(firestore, 'RECIPES'), (snapshot) => {
      if (!snapshot.empty) {
        const ingredients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPopularIngredients(ingredients);
      } else {
        console.log("Không có nguyên liệu phổ biến nào.");
      }
    }, (error) => {
      console.error("Lỗi khi lấy nguyên liệu phổ biến: ", error);
    });
  
    // Lắng nghe thay đổi cho món đã xem gần đây
    const recentDishesRef = doc(firestore, 'RECENT_DISHES', userId);
    const unsubscribeRecentDishes = onSnapshot(recentDishesRef, (docSnap) => {
      if (docSnap.exists) {
        const data = docSnap.data();
        setRecentDishes(data.dishes || []);
      } else {
        setRecentDishes([]);
      }
    }, (error) => {
      console.error("Lỗi khi lấy món đã xem gần đây: ", error);
    });
  
    // Cleanup function
    return () => {
      unsubscribeUser();
      unsubscribeRecipes();
      unsubscribeRecentDishes();
    };
  }, [userId]);

  const updateRecentDishes = async (item) => {
    const firestore = getFirestore();
    try {
      const recentDishesRef = doc(firestore, 'RECENT_DISHES', userId);
      const docSnap = await getDoc(recentDishesRef);

      if (!docSnap.exists) {
        await setDoc(recentDishesRef, { dishes: [item.id], idDishes: userId });
      } else {
        const data = docSnap.data();
        if (!data.dishes.includes(item.id)) {
          if (item && item.id) {
            data.dishes.push(item.id);
            await updateDoc(recentDishesRef, { dishes: data.dishes });
          }
        }
      }

      const updatedDocSnap = await getDoc(recentDishesRef);
      if (updatedDocSnap.exists) {
        const updatedData = updatedDocSnap.data();
        const validDishes = updatedData.dishes.filter(dishId =>
          dishId && popularIngredients.find(ingredient => ingredient.id === dishId)
        );

        setRecentDishes(validDishes.map(dishId => popularIngredients.find(ingredient => ingredient.id === dishId)).filter(Boolean));
      }

    } catch (error) {
      console.error("Lỗi khi cập nhật món đã xem gần đây: ", error);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => gestureState.dx > 20,
      onPanResponderMove: (evt, gestureState) => {
        slideAnim.setValue(Math.min(0, gestureState.dx));
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 100) {
          toggleDrawer();
        } else {
          closeDrawer();
        }
      },
    })
  ).current;

  const toggleDrawer = () => {
    setIsDrawerOpen(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    Animated.timing(slideAnim, {
      toValue: -330,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!userInfo) {
    return <Text style={styles.errorText}>Không tìm thấy thông tin người dùng.</Text>;
  }

  const goToRecipeDetail = (item) => {
    navigation.navigate('RecipeDetail', { recipeId: item.id });
    updateRecentDishes(item);
  };

  const renderIngredientItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.ingredientItem} 
      onPress={() => goToRecipeDetail(item)}
      activeOpacity={0.8}
    >
      <ImageBackground 
        source={{ uri: item.imageUri }} 
        style={styles.ingredientImage}
        imageStyle={styles.imageBackground}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        >
          <Text 
            style={styles.ingredientText} 
            numberOfLines={1}
            ellipsizeMode='tail'
          >
            {item.name}
          </Text>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );

  const renderRecentDishItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.recentDishItem}
      onPress={() => goToRecipeDetail(item)}
      activeOpacity={0.9}
    >
      <ImageBackground 
        source={{ uri: item.imageUri || 'https://via.placeholder.com/300' }} 
        style={styles.recentDishImage}
        imageStyle={styles.recentDishImageStyle}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.recentGradient}
        >
          <Text style={styles.recentDishText} numberOfLines={1} ellipsizeMode='tail'>
            {item.name}
          </Text>
          <View style={styles.authorContainer}>
            <Image source={{ uri: userInfo.imageUri }} style={styles.authorAvatar} />
            <Text style={styles.authorName}>{userInfo.fullName}</Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );

  const renderDrawerItem = (icon, text, screen) => (
    <TouchableOpacity 
      onPress={() => {
        closeDrawer();
        navigation.navigate(screen);
      }}
      style={styles.drawerItem}
    >
      <View style={styles.drawerIconContainer}>
        <Icon name={icon} size={22} color="#FF6B00" />
      </View>
      <Text style={styles.drawerItemText}>{text}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      

      {/* Main Header */}
      <View style={styles.header}>
        <TouchableWithoutFeedback onPress={toggleDrawer}>
          <Image source={{ uri: userInfo.imageUri }} style={styles.avatar} />
        </TouchableWithoutFeedback>
        <Text style={styles.searchText}>Tìm Kiếm</Text>
        <View style={styles.headerRight}>
          <IconButton 
            icon="bell-outline" 
            size={24} 
            color="#333"
            style={styles.bellIcon}
            onPress={() => console.log('Thông báo')} 
          />
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm công thức, nguyên liệu..."
          placeholderTextColor="#999"
          mode="outlined"
          outlineColor="#E0E0E0"
          activeOutlineColor="#FF6B00"
          theme={{ roundness: 12 }}
          left={<TextInput.Icon icon="magnify" color="#999" />}
          onPress={() => navigation.navigate('SearchInHome')}
        />
      </View>

      {/* Main Content */}
      <Animated.ScrollView 
        style={styles.body}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Chip
                style={[
                  styles.categoryChip,
                  selectedCategory === item && styles.selectedCategoryChip
                ]}
                textStyle={[
                  styles.categoryChipText,
                  selectedCategory === item && styles.selectedCategoryChipText
                ]}
                onPress={() => setSelectedCategory(item)}
              >
                {item}
              </Chip>
            )}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Popular Ingredients */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nguyên liệu phổ biến</Text>
            <TouchableOpacity onPress={() => console.log('Xem tất cả')}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={popularIngredients.slice(0, 6)}
            renderItem={renderIngredientItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.ingredientColumnWrapper}
            scrollEnabled={false}
          />
        </View>

        {/* Recent Dishes */}
        {recentDishes.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Món đã xem gần đây</Text>
              <TouchableOpacity onPress={() => navigation.navigate('RecentDishesScreen')}>
                <Text style={styles.seeAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={recentDishes.slice(0, 4)}
              renderItem={renderRecentDishItem}
              keyExtractor={(item, index) => item.id ? item.id : index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentDishesContainer}
            />
          </View>
        )}

        {/* Suggested For You */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
            <TouchableOpacity onPress={() => console.log('Xem tất cả')}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={popularIngredients.slice(0, 6).reverse()}
            renderItem={renderIngredientItem}
            keyExtractor={(item) => `suggested-${item.id}`}
            numColumns={2}
            columnWrapperStyle={styles.ingredientColumnWrapper}
            scrollEnabled={false}
          />
        </View>
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </Animated.ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={styles.cameraButton}
          onPress={() => navigation.navigate('DetectObject')}
          activeOpacity={0.8}
        >
          <Icon name="camera-alt" size={22} color="#FFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => navigation.navigate('AddRecipe')}
          activeOpacity={0.8}
          disabled={isDrawerOpen}
        >
          <Icon name="add" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      {/* Drawer */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.drawerHeader}>
          <TouchableOpacity 
            style={styles.drawerProfile}
            onPress={() => {
              closeDrawer();
              navigation.navigate('InfoCustomer');
            }}
          >
            <Image source={{ uri: userInfo.imageUri }} style={styles.drawerAvatar} />
            <View style={styles.drawerUserInfo}>
              <Text style={styles.drawerUserName}>{userInfo.fullName}</Text>
              <Text style={styles.drawerUserEmail}>Xem hồ sơ của bạn</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.drawerDivider} />
        
        <View style={styles.drawerContent}>
          {renderDrawerItem("person-outline", "Bếp Cá Nhân", "InfoCustomer")}
          {renderDrawerItem("notifications-none", "Hoạt Động", "RecentDishesScreen")}
          {renderDrawerItem("bar-chart", "Thống Kê Bếp", "RecentDishesScreen")}
          {renderDrawerItem("access-time", "Món Đã Xem Gần Đây", "RecentDishesScreen")}
          {renderDrawerItem("settings", "Cài đặt", "Stings")}
          {renderDrawerItem("send", "Gửi Phản Hồi", "RecentDishesScreen")}
        </View>
        
        <View style={styles.drawerFooter}>
          <TouchableOpacity style={styles.themeToggle}>
            <Icon name="brightness-2" size={22} color="#555" />
            <Text style={styles.themeToggleText}>Chế độ tối</Text>
            <View style={styles.toggleSwitch}>
              <View style={styles.toggleButton} />
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
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
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  searchText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  bellIcon: {
    margin: 0,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    zIndex: 2,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    height: 50,
  },
  body: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  categoriesContainer: {
    marginVertical: 16,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    marginRight: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  selectedCategoryChip: {
    backgroundColor: '#FF6B00',
  },
  categoryChipText: {
    color: '#555',
  },
  selectedCategoryChipText: {
    color: '#FFFFFF',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '500',
  },
  ingredientColumnWrapper: {
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  ingredientItem: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
  ingredientImage: {
    width: '100%',
    height: 160,
    justifyContent: 'flex-end',
  },
  imageBackground: {
    borderRadius: 12,
  },
  gradient: {
    height: '50%',
    justifyContent: 'flex-end',
    padding: 12,
  },
  ingredientText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  recentDishesContainer: {
    paddingHorizontal: 12,
  },
  recentDishItem: {
    width: CARD_WIDTH,
    height: 220,
    marginHorizontal: 4,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    backgroundColor: '#FFFFFF',
  },
  recentDishImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  recentDishImageStyle: {
    borderRadius: 12,
  },
  recentGradient: {
    height: '60%',
    justifyContent: 'flex-end',
    padding: 12,
  },
  recentDishText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  authorName: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'column',
    alignItems: 'center',
  },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 300,
    height: '100%',
    backgroundColor: '#FFFFFF',
    zIndex: 3,
    elevation: 10,
  },
  drawerHeader: {
    padding: 16,
    paddingTop: 40,
  },
  drawerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  drawerUserInfo: {
    marginLeft: 12,
  },
  drawerUserName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  drawerUserEmail: {
    fontSize: 14,
    color: '#FF6B00',
    marginTop: 2,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 8,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  drawerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  drawerItemText: {
    fontSize: 16,
    color: '#333',
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeToggleText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  toggleSwitch: {
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E0E0E0',
    padding: 2,
  },
  toggleButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  bottomPadding: {
    height: 80,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 18,
    color: 'red',
    marginTop: 20,
  },
});

export default SearchScreen;