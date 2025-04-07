import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  FlatList, 
  ActivityIndicator,
  StatusBar,
  Animated,
  Dimensions,
  Alert
} from 'react-native';
import { IconButton, Menu, Divider } from 'react-native-paper';
import { useMyContextController } from "../store";
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

const RecipeStorageScreen = () => {
    const [controller] = useMyContextController();
    const navigation = useNavigation();
    const { userLogin } = controller;
    const userId = userLogin.id;
    const [userInfo, setUserInfo] = useState(null);
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [menuVisible, setMenuVisible] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    
    // Animation values
    const scrollY = useRef(new Animated.Value(0)).current;
    const headerOpacity = scrollY.interpolate({
      inputRange: [0, 50],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    useEffect(() => {
        const unsubscribeRecentDishes = firestore()
            .collection('RECENT_DISHES')
            .where('idDishes', '==', userId)
            .onSnapshot(async snapshot => {
                const recentDishesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                if (recentDishesData.length > 0) {
                    const recipeIds = recentDishesData.map(dish => dish.dishes).flat();

                    // Lấy thông tin từ bảng RECIPES
                    const recipesData = await Promise.all(recipeIds.map(async (id) => {
                        const recipeDoc = await firestore().collection('RECIPES').doc(id).get();
                        return recipeDoc.exists ? { id: recipeDoc.id, ...recipeDoc.data() } : null;
                    }));

                    // Lọc ra các món không null
                    const validRecipes = recipesData.filter(recipe => recipe);

                    // Cập nhật state với thông tin món ăn và thông tin người dùng
                    const enrichedRecipes = await Promise.all(validRecipes.map(async recipe => {
                        const userDoc = await firestore().collection('USERS').doc(recipe.userId).get();
                        const userData = userDoc.exists ? userDoc.data() : null;
                        
                        // Thêm thời gian xem gần đây (giả lập)
                        const viewedAt = new Date();
                        viewedAt.setMinutes(viewedAt.getMinutes() - Math.floor(Math.random() * 60 * 24)); // Random trong 24h qua
                        
                        return { 
                          ...recipe, 
                          userInfo: userData,
                          viewedAt,
                          isFavorite: Math.random() > 0.5 // Giả lập trạng thái yêu thích
                        };
                    }));

                    // Sắp xếp theo thời gian xem gần đây nhất
                    enrichedRecipes.sort((a, b) => b.viewedAt - a.viewedAt);
                    
                    setRecipes(enrichedRecipes);
                }

                setLoading(false);
            }, error => {
                console.error('Error fetching recent dishes:', error);
                setLoading(false);
            }
        );

        const unsubscribeUser = firestore()
            .collection('USERS')
            .doc(userId)
            .onSnapshot(userDoc => {
                if (userDoc.exists) {
                    setUserInfo(userDoc.data());
                } else {
                    console.log('No such user document for userId:', userId);
                }
            }, error => {
                console.error('Error fetching user data:', error);
            });

        return () => {
            unsubscribeRecentDishes();
            unsubscribeUser();
        };
    }, [userId]);

    const goToRecipeDetail = (item) => {
        navigation.navigate('RecipeDetail', { recipeId: item.id });
    };
    
    const formatTimeAgo = (date) => {
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 60) {
        return `${diffMins} phút trước`;
      }
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) {
        return `${diffHours} giờ trước`;
      }
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) {
        return `${diffDays} ngày trước`;
      }
      
      return date.toLocaleDateString('vi-VN');
    };

    const renderRecipeItem = ({ item, index }) => {
        const truncatedIngredients = item.ingredients.length > 120 
          ? item.ingredients.substring(0, 120) + '...' 
          : item.ingredients;
          
        return (
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
                    <View style={styles.recipeContent}>
                        <View style={styles.recipeHeader}>
                            <Text style={styles.recipeTitle} numberOfLines={1}>{item.name}</Text>
                            <TouchableOpacity 
                                style={styles.moreButton}
                                onPress={() => {
                                    setSelectedRecipe(item);
                                    setMenuVisible(true);
                                }}
                            >
                                <Icon name="more-vert" size={20} color="#777" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.recipeBody}>
                            <View style={styles.recipeInfo}>
                                <Text style={styles.ingredients} numberOfLines={3}>{truncatedIngredients}</Text>
                                
                                <View style={styles.metaInfo}>
                                    <View style={styles.cookInfo}>
                                        <Icon name="timer" size={16} color="#FF6B00" />
                                        <Text style={styles.cookTime}>{item.cookTime || '30 phút'}</Text>
                                    </View>
                                    <View style={styles.viewInfo}>
                                        <Icon name="visibility" size={16} color="#777" />
                                        <Text style={styles.viewTime}>{formatTimeAgo(item.viewedAt)}</Text>
                                    </View>
                                </View>
                                
                                <View style={styles.userInfoContainer}>
                                    <Image source={{ uri: item.userInfo?.imageUri }} style={styles.avatar} />
                                    <Text style={styles.userName}>{item.userInfo?.fullName}</Text>
                                </View>
                            </View>
                            
                            <View style={styles.recipeImageContainer}>
                                <Image 
                                    source={{ uri: item.imageUri }} 
                                    style={styles.recipeImage} 
                                    resizeMode="cover" 
                                />
                                <TouchableOpacity 
                                    style={styles.favoriteButton}
                                    activeOpacity={0.8}
                                >
                                    <Icon 
                                        name={item.isFavorite ? "favorite" : "favorite-border"} 
                                        size={20} 
                                        color={item.isFavorite ? "#FF6B00" : "#FFF"} 
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const handleDeleteAll = async () => {
        Alert.alert(
          'Xóa lịch sử',
          'Bạn có chắc chắn muốn xóa toàn bộ lịch sử món đã xem?',
          [
            {
              text: 'Hủy',
              style: 'cancel',
            },
            {
              text: 'Xóa',
              style: 'destructive',
              onPress: async () => {
                setLoading(true);
                setMenuVisible(false);
            
                try {
                    // Xóa các bản ghi trong bảng "RECENT_DISHES" có userId của người dùng
                    await firestore()
                        .collection('RECENT_DISHES')
                        .where('idDishes', '==', userId)
                        .get()
                        .then(querySnapshot => {
                            const batch = firestore().batch();
                            querySnapshot.docs.forEach(doc => {
                                batch.delete(doc.ref);
                            });
                            return batch.commit();
                        });
            
                    // Cập nhật lại state
                    setRecipes([]);
                    setLoading(false);
                } catch (error) {
                    console.error('Error deleting recent dishes:', error);
                    setLoading(false);
                }
              }
            }
          ]
        );
    };
    
    const handleDeleteSingle = async (recipeId) => {
        setMenuVisible(false);
        
        Alert.alert(
          'Xóa món ăn',
          'Bạn có chắc chắn muốn xóa món ăn này khỏi lịch sử?',
          [
            {
              text: 'Hủy',
              style: 'cancel',
            },
            {
              text: 'Xóa',
              style: 'destructive',
              onPress: () => {
                // Xóa món ăn khỏi state
                setRecipes(recipes.filter(recipe => recipe.id !== recipeId));
                
                // Trong thực tế, bạn sẽ cần xóa bản ghi trong Firestore
                console.log('Xóa món ăn có ID:', recipeId);
              }
            }
          ]
        );
    };

    const handleBackPress = () => navigation.goBack();

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Image 
                style={styles.emptyImage} 
                source={require("../asset/MonDaXem.png")} 
                resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>Không có lịch sử xem món</Text>
            <Text style={styles.emptyDescription}>
                Bạn chưa xem món nào gần đây. Khám phá các công thức để tìm món ngon mới!
            </Text>
            <TouchableOpacity 
                style={styles.exploreButton}
                onPress={() => navigation.navigate('Trang chủ')}
                activeOpacity={0.8}
            >
                <Icon name="search" size={20} color="#FFF" />
                <Text style={styles.exploreButtonText}>Khám phá công thức</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            
            {/* Header with blur effect on scroll */}
            <Animated.View style={[styles.headerBlur, { opacity: headerOpacity }]}>
                <BlurView
                    style={styles.absolute}
                    blurType="light"
                    blurAmount={20}
                />
            </Animated.View>
            
            {/* Main Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={handleBackPress}
                    activeOpacity={0.7}
                >
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Món đã xem gần đây</Text>
                {recipes.length > 0 && (
                    <TouchableOpacity 
                        style={styles.clearButton}
                        onPress={handleDeleteAll}
                        activeOpacity={0.7}
                    >
                        <Icon name="delete-outline" size={24} color="#FF6B00" />
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF6B00" />
                    <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
                </View>
            ) : recipes.length > 0 ? (
                <Animated.FlatList
                    data={recipes}
                    renderItem={renderRecipeItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                />
            ) : (
                renderEmptyState()
            )}
            
            {/* Recipe Menu */}
            <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={{ x: width - 40, y: 80 }}
                contentStyle={styles.menuContent}
            >
                <Menu.Item 
                    onPress={() => {
                        setMenuVisible(false);
                        if (selectedRecipe) {
                            navigation.navigate('RecipeDetail', { recipeId: selectedRecipe.id });
                        }
                    }} 
                    title="Xem chi tiết" 
                    leadingIcon="eye"
                />
                <Menu.Item 
                    onPress={() => {
                        if (selectedRecipe) {
                            handleDeleteSingle(selectedRecipe.id);
                        }
                    }} 
                    title="Xóa khỏi lịch sử" 
                    leadingIcon="delete-outline"
                />
                <Divider />
                <Menu.Item 
                    onPress={() => {
                        setMenuVisible(false);
                        // Thêm vào bộ sưu tập
                        console.log('Thêm vào bộ sưu tập:', selectedRecipe?.id);
                    }} 
                    title="Thêm vào bộ sưu tập" 
                    leadingIcon="bookmark-outline"
                />
            </Menu>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
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
        height: 60,
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
        backgroundColor: '#FFFFFF',
        zIndex: 2,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        marginLeft: 12,
    },
    clearButton: {
        padding: 4,
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 20,
    },
    recipeItemContainer: {
        marginBottom: 16,
    },
    recipeItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    recipeContent: {
        padding: 16,
    },
    recipeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    recipeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    moreButton: {
        padding: 4,
    },
    recipeBody: {
        flexDirection: 'row',
    },
    recipeInfo: {
        flex: 1,
        marginRight: 16,
    },
    ingredients: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
        marginBottom: 12,
    },
    metaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cookInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    cookTime: {
        fontSize: 12,
        color: '#777',
        marginLeft: 4,
    },
    viewInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewTime: {
        fontSize: 12,
        color: '#777',
        marginLeft: 4,
    },
    userInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    userName: {
        fontSize: 12,
        color: '#555',
    },
    recipeImageContainer: {
        width: 120,
        height: 120,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    recipeImage: {
        width: '100%',
        height: '100%',
    },
    favoriteButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContent: {
        borderRadius: 12,
        marginTop: 36,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
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
    exploreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B00',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    exploreButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default RecipeStorageScreen;