import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TouchableWithoutFeedback, 
  Image, 
  Animated, 
  FlatList, 
  ActivityIndicator,
  StatusBar,
  Dimensions,
  ScrollView
} from 'react-native';
import { IconButton, Searchbar } from 'react-native-paper';
import { useMyContextController } from "../store";
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

const RecipeStorageScreen = () => {
    const [controller] = useMyContextController();
    const { userLogin } = controller;
    const userId = userLogin.id;
    const [userInfo, setUserInfo] = useState(null);
    const navigation = useNavigation();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const slideAnim = useRef(new Animated.Value(-330)).current;
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [filteredRecipes, setFilteredRecipes] = useState([]);

    // Animation values
    const scrollY = useRef(new Animated.Value(0)).current;
    const headerOpacity = scrollY.interpolate({
      inputRange: [0, 500],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    const toggleDrawer = () => {
        setIsDrawerOpen(!isDrawerOpen);
        Animated.timing(slideAnim, {
            toValue: isDrawerOpen ? -330 : 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    useEffect(() => {
        const unsubscribeRecipes = firestore()
            .collection('RECIPES')
            .where('userId', '==', userId)
            .onSnapshot(snapshot => {
                const recipesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRecipes(recipesData);
                setFilteredRecipes(recipesData);
                if (recipesData.length > 0) {
                    console.log('Recipes found:', recipesData.length);
                } else {
                    console.log('No recipes found for userId:', userId);
                }
            }, error => {
                console.error('Error fetching recipes:', error);
            });

        const unsubscribeUser = firestore()
            .collection('USERS')
            .doc(userId)
            .onSnapshot(userDoc => {
                if (userDoc.exists) {
                    const data = userDoc.data();
                    setUserInfo(data);
                } else {
                    console.log('No such user document for userId:', userId);
                }
            }, error => {
                console.error('Error fetching user data:', error);
            });

        return () => {
            unsubscribeRecipes();
            unsubscribeUser();
        };
    }, [userId]);

    useEffect(() => {
        if (recipes.length > 0 || userInfo) {
            setLoading(false);
        }
    }, [recipes, userInfo]);

    useEffect(() => {
        filterRecipes(searchQuery, activeTab);
    }, [searchQuery, activeTab, recipes]);

    const filterRecipes = (query, tab) => {
        let filtered = [...recipes];
        
        // Filter by search query
        if (query) {
            filtered = filtered.filter(recipe => 
                recipe.name.toLowerCase().includes(query.toLowerCase())
            );
        }
        
        // Filter by tab
        if (tab === 'favorite') {
            filtered = filtered.filter(recipe => recipe.isFavorite);
        } else if (tab === 'recent') {
            // Sort by most recent (assuming there's a timestamp field)
            filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
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
                            outputRange: [1, 1, 1, 0.9],
                            extrapolate: 'clamp'
                        }) 
                    }],
                    opacity: scrollY.interpolate({
                        inputRange: [100 * (index - 1), 100 * index, 100 * (index + 1)],
                        outputRange: [1, 1, 0.5],
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
                    source={{ uri: item.imageUri }}
                    style={styles.recipeImage}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.recipeGradient}
                >
                    <View style={styles.recipeInfo}>
                        <Text style={styles.recipeTitle} numberOfLines={2}>{item.name}</Text>
                        <View style={styles.recipeMetaContainer}>
                            <View style={styles.userInfoContainer}>
                                <Image
                                    source={{ uri: userInfo?.imageUri }}
                                    style={styles.avatarSmall}
                                />
                                <Text style={styles.userName}>{userInfo?.fullName}</Text>
                            </View>
                            <View style={styles.statsContainer}>
                                <Icon name="timer" size={16} color="#FFF" />
                                <Text style={styles.statText}>{item.cookTime || '30 phút'}</Text>
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
            <Text style={styles.emptyTitle}>Kho món ngon của bạn đang trống</Text>
            <Text style={styles.emptyDescription}>
                Bạn chưa lưu, tạo hoặc nhận bất kỳ công thức nào. Khi nào có, bạn sẽ thấy tất cả món ở đây!
            </Text>
            <TouchableOpacity 
                style={styles.createButton}
                onPress={() => navigation.navigate('AddRecipe')}
                activeOpacity={0.8}
            >
                <Icon name="add" size={20} color="#FFF" />
                <Text style={styles.createButtonText}>Tạo công thức mới</Text>
            </TouchableOpacity>
        </View>
    );

    const renderDrawerItem = (icon, text, screen) => (
        <TouchableOpacity 
            onPress={() => {
                toggleDrawer();
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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B00" />
                <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            
            
            {/* Main Header */}
            <View style={styles.header}>
                <TouchableWithoutFeedback onPress={toggleDrawer}>
                    <Image
                        source={{ uri: userInfo?.imageUri }}
                        style={styles.avatar}
                    />
                </TouchableWithoutFeedback>
                <Text style={styles.headerTitle}>Kho món ngon</Text>
                <IconButton
                    icon="bell-outline"
                    size={24}
                    color="#333"
                    onPress={() => console.log('Thông báo')}
                />
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
            
            {/* Recipe List */}
            {filteredRecipes.length > 0 ? (
                <Animated.FlatList
                    data={filteredRecipes}
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
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    {renderEmptyState()}
                </ScrollView>
            )}
            
            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.floatingButton}
                onPress={() => navigation.navigate('AddRecipe')}
                activeOpacity={0.8}
                disabled={isDrawerOpen}
            >
                <Icon name="add" size={26} color="#FFF" />
            </TouchableOpacity>
            
            {/* Drawer Overlay */}
            {isDrawerOpen && (
                <TouchableWithoutFeedback onPress={toggleDrawer}>
                    <View style={styles.overlay} />
                </TouchableWithoutFeedback>
            )}
            
            {/* Drawer */}
            <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
                <View style={styles.drawerHeader}>
                    <TouchableOpacity 
                        style={styles.drawerProfile}
                        onPress={() => {
                            toggleDrawer();
                            navigation.navigate('InfoCustomer');
                        }}
                    >
                        <Image source={{ uri: userInfo?.imageUri }} style={styles.drawerAvatar} />
                        <View style={styles.drawerUserInfo}>
                            <Text style={styles.drawerUserName}>{userInfo?.fullName}</Text>
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
        marginTop: 12,
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
        backgroundColor: '#FFFFFF',
        zIndex: 2,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingBottom: 8,
        backgroundColor: '#FFFFFF',
        zIndex: 2,
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
        zIndex: 2,
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
    listContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 80,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 80,
    },
    recipeItemContainer: {
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
        backgroundColor: '#FFFFFF',
    },
    recipeItem: {
        width: '100%',
        height: 220,
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
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        fontSize: 12,
        color: '#FFFFFF',
        marginLeft: 4,
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
    },
    emptyImage: {
        width: 200,
        height: 200,
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
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B00',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    floatingButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#FF6B00',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
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
});

export default RecipeStorageScreen;