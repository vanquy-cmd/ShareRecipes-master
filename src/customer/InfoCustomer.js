import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView, 
  Dimensions,
  StatusBar
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import { useMyContextController } from "../store";
import Share from 'react-native-share';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const InfoCustomer = () => {
    const navigation = useNavigation();
    const [controller] = useMyContextController();
    const { userLogin } = controller;
    const userId = userLogin.id;
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('recipes');
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [recipesCount, setRecipesCount] = useState(0);

    useEffect(() => {
        // Fetch user info, followers count, and following count
        const fetchUserData = async () => {
            try {
                // Get user info
                const userDocRef = firestore().collection('USERS').doc(userId);
                
                // Get followers count (người quan tâm)
                const followersSnapshot = await userDocRef.collection('FOLLOWERS').get();
                setFollowersCount(followersSnapshot.size);
                
                // Get following count (bạn bếp)
                const followingSnapshot = await userDocRef.collection('FOLLOWING').get();
                setFollowingCount(followingSnapshot.size);
                
                // Get recipes count
                const recipesSnapshot = await firestore()
                    .collection('RECIPES')
                    .where('userId', '==', userId)
                    .get();
                setRecipesCount(recipesSnapshot.size);
                
                // Set up real-time listener for user info
                const unsubscribe = userDocRef.onSnapshot(userDoc => {
                    if (userDoc.exists) {
                        const data = userDoc.data();
                        setUserInfo(data);
                        setLoading(false);
                    } else {
                        console.log('No such document!');
                        setLoading(false);
                    }
                }, error => {
                    console.error(error);
                    setLoading(false);
                });
                
                return unsubscribe;
            } catch (error) {
                console.error('Error fetching user data:', error);
                setLoading(false);
                return () => {};
            }
        };

        const unsubscribe = fetchUserData();
        return () => unsubscribe;
    }, [userId]);

    const handleBackPress = () => {
        navigation.goBack();
    };
    
    const goToEditInfoCustomer = () => {
        navigation.navigate('EditInfoCustomer');
    };

    const shareInfo = async () => {
        try {
            const message = 
                `🌟 Thông tin người dùng 🌟\n` +
                `--------------------------------\n` +
                `Tên: ${userInfo.fullName}\n` +
                `Tài khoản: ${userInfo.id}`;
                
            const shareOptions = {
                title: 'Chia sẻ thông tin người dùng',
                message: message,
            };
    
            await Share.open(shareOptions);
        } catch (error) {
            console.log(error.message);
        }
    };
    
    const navigateToFollowers = () => {
        navigation.navigate('SocialConnections', { initialTab: 'followers', userId });
    };
    
    const navigateToFollowing = () => {
        navigation.navigate('SocialConnections', { initialTab: 'following', userId });
    };
    
    const navigateToRecipes = () => {
        navigation.navigate('UserRecipes', { userId });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B00" />
                <Text style={styles.loadingText}>Đang tải thông tin...</Text>
            </View>
        );
    }

    if (!userInfo) {
        return (
            <View style={styles.errorContainer}>
                <Icon name="error-outline" size={60} color="#FF6B00" />
                <Text style={styles.errorText}>Không tìm thấy thông tin người dùng.</Text>
                <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.retryButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />
            
            {/* Cover Image and Header */}
            <View style={styles.coverContainer}>
                <LinearGradient
                    colors={['#FF6B00', '#FF9E45']}
                    style={styles.coverGradient}
                >
                    <View style={styles.headerButtons}>
                        <IconButton 
                            icon="arrow-left" 
                            iconColor="#FFF" 
                            size={26}
                            onPress={handleBackPress} 
                        />
                        <IconButton 
                            icon={() => <Icon name="share" size={24} color="#FFF" />}
                            onPress={shareInfo} 
                        />
                    </View>
                </LinearGradient>
            </View>
            
            {/* Profile Info */}
            <View style={styles.profileContainer}>
                <Image
                    source={{ uri: userInfo.imageUri }}
                    style={styles.avatar}
                />
                
                <View style={styles.nameContainer}>
                    <Text style={styles.name}>{userInfo.fullName}</Text>
                    <Text style={styles.username}>{userInfo.id}</Text>
                </View>
                
                <View style={styles.statsContainer}>
                    <TouchableOpacity 
                        style={styles.statItem}
                        onPress={navigateToRecipes}
                    >
                        <Text style={styles.statNumber}>{recipesCount}</Text>
                        <Text style={styles.statLabel}>Công thức</Text>
                    </TouchableOpacity>
                    <View style={styles.statDivider} />
                    <TouchableOpacity 
                        style={styles.statItem}
                        onPress={navigateToFollowing}
                    >
                        <Text style={styles.statNumber}>{followingCount}</Text>
                        <Text style={styles.statLabel}>Bạn bếp</Text>
                    </TouchableOpacity>
                    <View style={styles.statDivider} />
                    <TouchableOpacity 
                        style={styles.statItem}
                        onPress={navigateToFollowers}
                    >
                        <Text style={styles.statNumber}>{followersCount}</Text>
                        <Text style={styles.statLabel}>Người quan tâm</Text>
                    </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                    style={styles.editButton}
                    onPress={goToEditInfoCustomer}
                    activeOpacity={0.8}
                >
                    <Icon name="edit" size={18} color="#FF6B00" />
                    <Text style={styles.editButtonText}>Sửa thông tin</Text>
                </TouchableOpacity>
            </View>
            
            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity 
                    style={[
                        styles.tab, 
                        activeTab === 'recipes' && styles.activeTab
                    ]}
                    onPress={() => setActiveTab('recipes')}
                >
                    <Icon 
                        name="restaurant" 
                        size={24} 
                        color={activeTab === 'recipes' ? '#FF6B00' : '#888'} 
                    />
                    <Text 
                        style={[
                            styles.tabText,
                            activeTab === 'recipes' && styles.activeTabText
                        ]}
                    >
                        Công thức
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[
                        styles.tab, 
                        activeTab === 'saved' && styles.activeTab
                    ]}
                    onPress={() => setActiveTab('saved')}
                >
                    <Icon 
                        name="bookmark" 
                        size={24} 
                        color={activeTab === 'saved' ? '#FF6B00' : '#888'} 
                    />
                    <Text 
                        style={[
                            styles.tabText,
                            activeTab === 'saved' && styles.activeTabText
                        ]}
                    >
                        Đã lưu
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[
                        styles.tab, 
                        activeTab === 'liked' && styles.activeTab
                    ]}
                    onPress={() => setActiveTab('liked')}
                >
                    <Icon 
                        name="favorite" 
                        size={24} 
                        color={activeTab === 'liked' ? '#FF6B00' : '#888'} 
                    />
                    <Text 
                        style={[
                            styles.tabText,
                            activeTab === 'liked' && styles.activeTabText
                        ]}
                    >
                        Đã thích
                    </Text>
                </TouchableOpacity>
            </View>
            
            {/* Content */}
            <ScrollView style={styles.contentContainer}>
                <View style={styles.emptyStateContainer}>
                    <Image
                        source={require("../asset/chen.png")}
                        style={styles.emptyStateIcon}
                    />
                    <Text style={styles.emptyStateTitle}>
                        {activeTab === 'recipes' ? 'Chưa có công thức nào' : 
                         activeTab === 'saved' ? 'Chưa lưu công thức nào' : 
                         'Chưa thích công thức nào'}
                    </Text>
                    <Text style={styles.emptyStateDescription}>
                        {activeTab === 'recipes' ? 'Hãy thêm công thức đầu tiên của bạn' : 
                         activeTab === 'saved' ? 'Lưu công thức yêu thích để xem sau' : 
                         'Thích công thức để theo dõi cập nhật'}
                    </Text>
                    
                    {activeTab === 'recipes' && (
                        <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('AddRecipe')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.actionButtonText}>Thêm công thức mới</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.floatingButton}
                onPress={() => navigation.navigate('AddRecipe')}
                activeOpacity={0.8}
            >
                <Icon name="add" size={26} color="#FFF" />
            </TouchableOpacity>
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#555',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#FF6B00',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    coverContainer: {
        height: 180,
        width: '100%',
    },
    coverGradient: {
        height: '100%',
        width: '100%',
        paddingTop: StatusBar.currentHeight || 0,
    },
    headerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingTop: 8,
    },
    profileContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: -60,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    nameContainer: {
        alignItems: 'center',
        marginTop: 12,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    username: {
        fontSize: 16,
        color: '#777',
        marginTop: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 24,
        paddingHorizontal: 16,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 14,
        color: '#777',
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: '80%',
        backgroundColor: '#E0E0E0',
        alignSelf: 'center',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#FF6B00',
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 24,
        marginTop: 24,
        width: '80%',
    },
    editButtonText: {
        color: '#FF6B00',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    tabsContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#EEEEEE',
        marginTop: 24,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#FF6B00',
    },
    tabText: {
        fontSize: 14,
        color: '#888',
        marginLeft: 6,
    },
    activeTabText: {
        color: '#FF6B00',
        fontWeight: '600',
    },
    contentContainer: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyStateIcon: {
        width: 100,
        height: 100,
        marginBottom: 16,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    emptyStateDescription: {
        fontSize: 16,
        color: '#777',
        textAlign: 'center',
        marginBottom: 24,
    },
    actionButton: {
        backgroundColor: '#FF6B00',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
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
});

export default InfoCustomer;