import React, { useState, useRef, useEffect } from 'react';
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
  StatusBar,
  Dimensions
} from 'react-native';
import { TextInput, IconButton, Searchbar, Badge } from 'react-native-paper';
import { useMyContextController } from "../store";
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const MessengerScreen = () => {
  const [controller] = useMyContextController();
  const { userLogin } = controller;
  const userId = userLogin.id;
  const navigation = useNavigation();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-330)).current;
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const toggleDrawer = () => {
    setIsDrawerOpen(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    Animated.timing(slideAnim, {
      toValue: -330,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
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
  
    return unsubscribeUser;
  }, [userId]);
  
  useEffect(() => {
    const unsubscribe = firestore()
      .collection('USERS')
      .onSnapshot((querySnapshot) => {
        const userData = [];
        querySnapshot.forEach((doc) => {
          const user = { 
            id: doc.id, 
            ...doc.data(),
            // Thêm dữ liệu mẫu cho giao diện
            lastMessage: "Bạn đã xem công thức của tôi chưa?",
            lastMessageTime: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(),
            unreadCount: Math.floor(Math.random() * 5),
            online: Math.random() > 0.5
          };
          // Chỉ thêm người dùng không phải là người dùng hiện tại
          if (user.id !== userId) {
            userData.push(user);
          }
        });
        setUsers(userData);
        setFilteredUsers(userData);
        setLoading(false);
      });
  
    return unsubscribe;
  }, [userId]);
  
  const handleSearch = (query) => {
    setSearchQuery(query);
    filterUsers(query, activeTab);
  };

  const filterUsers = (query, tab) => {
    let filtered = [...users];
    
    // Filter by search query
    if (query) {
      filtered = filtered.filter(user =>
        user.fullName.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Filter by tab
    if (tab === 'unread') {
      filtered = filtered.filter(user => user.unreadCount > 0);
    } else if (tab === 'online') {
      filtered = filtered.filter(user => user.online);
    }
    
    setFilteredUsers(filtered);
  };

  useEffect(() => {
    filterUsers(searchQuery, activeTab);
  }, [activeTab, users]);

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today - show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      // Yesterday
      return 'Hôm qua';
    } else if (diffDays < 7) {
      // Within a week
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return days[date.getDay()];
    } else {
      // More than a week
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }
  };

  const renderUserItem = ({ item, index }) => (
    <Animated.View
      style={[
        styles.userItemContainer,
        {
          transform: [{ 
            translateX: scrollY.interpolate({
              inputRange: [-50, 0, 100 * index, 100 * (index + 3)],
              outputRange: [0, 0, 0, -20],
              extrapolate: 'clamp'
            }) 
          }],
          opacity: scrollY.interpolate({
            inputRange: [100 * (index - 3), 100 * index, 100 * (index + 3)],
            outputRange: [0.7, 1, 0.7],
            extrapolate: 'clamp'
          })
        }
      ]}
    >
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => navigation.navigate('messageDetail', { receiverId: item.id, receiverName: item.fullName })}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {item.imageUri ? (
            <Image source={{ uri: item.imageUri }} style={styles.avatar1} />
          ) : (
            <Image
              source={require('../asset/ngD.png')}
              style={styles.avatar1}
            />
          )}
          {item.online && <View style={styles.onlineIndicator} />}
        </View>
        
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={styles.userName} numberOfLines={1}>{item.fullName}</Text>
            <Text style={styles.messageTime}>{formatTime(item.lastMessageTime)}</Text>
          </View>
          
          <View style={styles.messagePreview}>
            <Text style={[
              styles.lastMessage, 
              item.unreadCount > 0 && styles.unreadMessage
            ]} numberOfLines={1}>
              {item.lastMessage}
            </Text>
            
            {item.unreadCount > 0 && (
              <Badge style={styles.unreadBadge}>{item.unreadCount}</Badge>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={require('../asset/ngD.png')} 
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Chưa có tin nhắn nào</Text>
      <Text style={styles.emptyDescription}>
        Bắt đầu trò chuyện với các đầu bếp khác để chia sẻ công thức và kinh nghiệm nấu ăn.
      </Text>
    </View>
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
      </View>
    );
  }

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
        <TouchableWithoutFeedback onPress={toggleDrawer}>
          <Image source={{ uri: userInfo.imageUri }} style={styles.avatar} />
        </TouchableWithoutFeedback>
        <Text style={styles.headerTitle}>Tin nhắn</Text>
        <View style={styles.headerRight}>
          <IconButton 
            icon="bell-outline" 
            size={24} 
            color="#333"
            style={styles.bellIcon}
            onPress={() => console.log('Thông báo')} 
          />
          <IconButton 
            icon="pencil" 
            size={24} 
            color="#333"
            style={styles.newMessageIcon}
            onPress={() => console.log('Tin nhắn mới')} 
          />
        </View>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Tìm kiếm người dùng..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor="#777"
        />
      </View>
      
      {/* Filter Tabs */}
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
          style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
          onPress={() => setActiveTab('unread')}
        >
          <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>
            Chưa đọc
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'online' && styles.activeTab]}
          onPress={() => setActiveTab('online')}
        >
          <Text style={[styles.tabText, activeTab === 'online' && styles.activeTabText]}>
            Đang hoạt động
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* User List */}
      {filteredUsers.length > 0 ? (
        <Animated.FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.userList}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      ) : (
        <View style={styles.noResultsContainer}>
          {searchQuery ? (
            <View style={styles.noResultsContent}>
              <Icon name="search-off" size={60} color="#DDD" />
              <Text style={styles.noResultsText}>
                Không tìm thấy người dùng nào phù hợp với "{searchQuery}"
              </Text>
            </View>
          ) : (
            renderEmptyState()
          )}
        </View>
      )}
      
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
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  bellIcon: {
    margin: 0,
  },
  newMessageIcon: {
    margin: 0,
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
  userList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  userItemContainer: {
    marginBottom: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar1: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F0F0',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#777',
    flex: 1,
  },
  unreadMessage: {
    color: '#333',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#FF6B00',
    marginLeft: 8,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyImage: {
    width: 120,
    height: 120,
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

export default MessengerScreen;