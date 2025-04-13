import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Animated, 
  FlatList, 
  ActivityIndicator,
  StatusBar,
  Dimensions,
  ScrollView,
  Platform
} from 'react-native';
import { Searchbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

const UserRecipes = ({ route }) => {
  const { userId } = route.params;
  const navigation = useNavigation();
  const [recipes, setRecipes] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchUserAndRecipes = async () => {
      try {
        setLoading(true);
        console.log('Fetching recipes for userId:', userId);
        
        // Fetch user info
        const userDoc = await firestore().collection('USERS').doc(userId).get();
        if (userDoc.exists) {
          setUserInfo(userDoc.data());
          console.log('User info found:', userDoc.data().fullName);
        } else {
          console.log('User document not found for ID:', userId);
        }
        
        // Xử lý userId để thử nhiều định dạng khác nhau
        let userIdVariations = [userId];
        
        // Nếu userId bắt đầu bằng @, thêm phiên bản không có @
        if (userId.startsWith('@')) {
          userIdVariations.push(userId.substring(1));
        } else {
          // Nếu không có @, thêm phiên bản có @
          userIdVariations.push('@' + userId);
        }
        
        // Thêm phiên bản viết thường và viết hoa
        userIdVariations.push(userId.toLowerCase());
        userIdVariations.push(userId.toUpperCase());
        
        // Loại bỏ các giá trị trùng lặp
        userIdVariations = [...new Set(userIdVariations)];
        
        console.log('Trying userId variations:', userIdVariations);
        
        // Mảng để lưu tất cả các công thức tìm thấy
        let allRecipes = [];
        
        // Thử tìm kiếm với nhiều trường khác nhau và nhiều biến thể của userId
        for (const idVariation of userIdVariations) {
          // Thử với trường userId
          const recipesSnapshot1 = await firestore()
            .collection('RECIPES')
            .where('userId', '==', idVariation)
            .get();
            
          if (!recipesSnapshot1.empty) {
            const newRecipes = recipesSnapshot1.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log(`Found ${newRecipes.length} recipes with userId = ${idVariation}`);
            allRecipes = [...allRecipes, ...newRecipes];
          }
          
          // Thử với trường creatorId
          const recipesSnapshot2 = await firestore()
            .collection('RECIPES')
            .where('creatorId', '==', idVariation)
            .get();
            
          if (!recipesSnapshot2.empty) {
            const newRecipes = recipesSnapshot2.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log(`Found ${newRecipes.length} recipes with creatorId = ${idVariation}`);
            allRecipes = [...allRecipes, ...newRecipes];
          }
          
          // Thử với trường creator
          const recipesSnapshot3 = await firestore()
            .collection('RECIPES')
            .where('creator', '==', idVariation)
            .get();
            
          if (!recipesSnapshot3.empty) {
            const newRecipes = recipesSnapshot3.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log(`Found ${newRecipes.length} recipes with creator = ${idVariation}`);
            allRecipes = [...allRecipes, ...newRecipes];
          }
          
          // Thử với trường user
          const recipesSnapshot4 = await firestore()
            .collection('RECIPES')
            .where('user', '==', idVariation)
            .get();
            
          if (!recipesSnapshot4.empty) {
            const newRecipes = recipesSnapshot4.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log(`Found ${newRecipes.length} recipes with user = ${idVariation}`);
            allRecipes = [...allRecipes, ...newRecipes];
          }
        }
        
        // Nếu vẫn không tìm thấy công thức, thử tìm trong subcollection
        if (allRecipes.length === 0) {
          console.log('Trying to find recipes in subcollection RECIPES of user');
          const userRecipesSnapshot = await firestore()
            .collection('USERS')
            .doc(userId)
            .collection('RECIPES')
            .get();
            
          if (!userRecipesSnapshot.empty) {
            const newRecipes = userRecipesSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log(`Found ${newRecipes.length} recipes in user's RECIPES subcollection`);
            allRecipes = [...allRecipes, ...newRecipes];
          }
        }
        
        // Loại bỏ các công thức trùng lặp dựa trên ID
        const uniqueRecipes = Array.from(
          new Map(allRecipes.map(recipe => [recipe.id, recipe])).values()
        );
        
        console.log(`Total unique recipes found: ${uniqueRecipes.length}`);
        
        // Nếu vẫn không tìm thấy công thức, thử tìm kiếm tất cả công thức và lọc theo tên người dùng
        if (uniqueRecipes.length === 0 && userInfo) {
          console.log('Trying to find recipes by user fullName:', userInfo.fullName);
          const allRecipesSnapshot = await firestore()
            .collection('RECIPES')
            .limit(100) // Giới hạn số lượng để tránh tải quá nhiều
            .get();
            
          const possibleMatches = allRecipesSnapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .filter(recipe => {
              // Kiểm tra nếu tên người tạo chứa tên người dùng
              const creatorName = recipe.creatorName || recipe.userName || '';
              return creatorName.includes(userInfo.fullName);
            });
            
          if (possibleMatches.length > 0) {
            console.log(`Found ${possibleMatches.length} recipes by matching creator name`);
            uniqueRecipes.push(...possibleMatches);
          }
        }
        
        setRecipes(uniqueRecipes);
        setFilteredRecipes(uniqueRecipes);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user recipes:', error);
        setLoading(false);
      }
    };
    
    fetchUserAndRecipes();
  }, [userId]);
  
  useEffect(() => {
    filterRecipes(searchQuery, activeTab);
  }, [searchQuery, activeTab, recipes]);
  
  const filterRecipes = (query, tab) => {
    let filtered = [...recipes];
    
    // Filter by search query
    if (query) {
      filtered = filtered.filter(recipe => 
        recipe.name?.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Filter by tab
    if (tab === 'favorite') {
      filtered = filtered.filter(recipe => recipe.isFavorite);
    } else if (tab === 'recent') {
      // Sort by most recent (assuming there's a timestamp field)
      filtered.sort((a, b) => {
        const timeA = a.timestamp || a.createdAt || a.updatedAt || 0;
        const timeB = b.timestamp || b.createdAt || b.updatedAt || 0;
        return (timeB - timeA);
      });
      filtered = filtered.slice(0, 5); // Get only 5 most recent
    }
    
    setFilteredRecipes(filtered);
  };
  
  const onChangeSearch = query => {
    setSearchQuery(query);
  };
  
  const goToRecipeDetail = (item) => {
    navigation.navigate('RecipeDetail', { recipeId: item.id });
  };
  
  const renderRecipeItem = ({ item, index }) => (
    <Animated.View 
      style={[
        styles.recipeItemContainer,
        {
          transform: [{ 
            scale: scrollY.interpolate({
              inputRange: [-100, 0, 100 * index, 100 * (index + 2)],
              outputRange: [1, 1, 1, 0.95],
              extrapolate: 'clamp'
            }) 
          }],
          opacity: scrollY.interpolate({
            inputRange: [100 * (index - 1), 100 * index, 100 * (index + 1)],
            outputRange: [1, 1, 0.7],
            extrapolate: 'clamp'
          })
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.recipeItem} 
        onPress={() => goToRecipeDetail(item)}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: item.imageUri || 'https://via.placeholder.com/400x200?text=No+Image' }}
          style={styles.recipeImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.recipeGradient}
        >
          <View style={styles.recipeInfo}>
            <Text style={styles.recipeTitle} numberOfLines={2}>{item.name || 'Không có tên'}</Text>
            <View style={styles.recipeMetaContainer}>
              <View style={styles.userInfoContainer}>
                <Image
                  source={{ uri: userInfo?.imageUri || 'https://via.placeholder.com/50' }}
                  style={styles.avatarSmall}
                />
                <Text style={styles.userName}>{userInfo?.fullName || 'Người dùng'}</Text>
              </View>
              <View style={styles.statsContainer}>
                <Icon name="timer" size={16} color="#FFF" />
                <Text style={styles.statText}>{item.cookingTime || item.cookTime || '30 phút'}</Text>
                <Icon name="favorite" size={16} color="#FFF" style={{marginLeft: 8}} />
                <Text style={styles.statText}>{item.likes || 0}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
        <TouchableOpacity style={styles.favoriteButton}>
          <Icon 
            name={item.isFavorite ? "favorite" : "favorite-border"} 
            size={24} 
            color={item.isFavorite ? "#FF6B00" : "#FFF"} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image 
        style={styles.emptyImage} 
        source={require("../asset/KhoMonAn.png")} 
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Chưa có công thức nào</Text>
      <Text style={styles.emptyDescription}>
        Người dùng này chưa tạo hoặc chia sẻ bất kỳ công thức nào, hoặc công thức đã được lưu trữ theo cách khác trong cơ sở dữ liệu.
      </Text>
      <TouchableOpacity 
        style={styles.debugButton}
        onPress={() => console.log('User ID:', userId, 'User Info:', userInfo)}
      >
        <Text style={styles.debugButtonText}>Kiểm tra thông tin người dùng</Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      {/* Thêm padding top để đẩy nội dung xuống dưới */}
      <View style={styles.statusBarSpace} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Công thức của {userInfo?.fullName || 'người dùng'}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Tìm kiếm công thức..."
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor="#777"
        />
      </View>
      
      {/* Category Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            Tất cả
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'favorite' && styles.activeTab]}
          onPress={() => setActiveTab('favorite')}
        >
          <Text style={[styles.tabText, activeTab === 'favorite' && styles.activeTabText]}>
            Yêu thích
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
          onPress={() => setActiveTab('recent')}
        >
          <Text style={[styles.tabText, activeTab === 'recent' && styles.activeTabText]}>
            Gần đây
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : filteredRecipes.length > 0 ? (
        <Animated.FlatList
          data={filteredRecipes}
          renderItem={renderRecipeItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {renderEmptyState()}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  statusBarSpace: {
    height: STATUSBAR_HEIGHT,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    height: 46,
  },
  searchInput: {
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  activeTab: {
    backgroundColor: '#FF6B00',
  },
  tabText: {
    fontSize: 14,
    color: '#555',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  recipeItemContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  recipeItem: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  recipeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    justifyContent: 'flex-end',
    padding: 16,
  },
  recipeInfo: {
    justifyContent: 'flex-end',
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  recipeMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  userName: {
    fontSize: 12,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyImage: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  debugButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  debugButtonText: {
    color: '#555',
    fontSize: 14,
  },
});

export default UserRecipes;