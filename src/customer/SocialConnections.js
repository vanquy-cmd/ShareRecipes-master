import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  FlatList,
  StatusBar,
  SafeAreaView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';

const SocialConnections = ({ route }) => {
  const { initialTab = 'followers', userId } = route.params;
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSocialConnections = async () => {
      try {
        setLoading(true);
        
        // Fetch followers (người quan tâm)
        const followersSnapshot = await firestore()
          .collection('USERS')
          .doc(userId)
          .collection('FOLLOWERS')
          .get();
          
        const followersIds = followersSnapshot.docs.map(doc => doc.id);
        
        // Fetch following (bạn bếp)
        const followingSnapshot = await firestore()
          .collection('USERS')
          .doc(userId)
          .collection('FOLLOWING')
          .get();
          
        const followingIds = followingSnapshot.docs.map(doc => doc.id);
        
        // Get user details for followers
        const followersPromises = followersIds.map(id => 
          firestore().collection('USERS').doc(id).get()
        );
        
        const followersResults = await Promise.all(followersPromises);
        const followersData = followersResults
          .filter(doc => doc.exists)
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        
        // Get user details for following
        const followingPromises = followingIds.map(id => 
          firestore().collection('USERS').doc(id).get()
        );
        
        const followingResults = await Promise.all(followingPromises);
        const followingData = followingResults
          .filter(doc => doc.exists)
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        
        setFollowers(followersData);
        setFollowing(followingData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching social connections:', error);
        setLoading(false);
      }
    };
    
    fetchSocialConnections();
  }, [userId]);

  const handleUserPress = (selectedUserId) => {
    if (selectedUserId === userId) {
      // If it's the current user, navigate to their profile
      navigation.navigate('InfoCustomer');
    } else {
      // If it's another user, navigate to their friend detail page
      navigation.navigate('FriendDetail', { userId: selectedUserId });
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => handleUserPress(item.id)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: item.imageUri || 'https://via.placeholder.com/50' }} 
        style={styles.userImage} 
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.fullName}</Text>
        <Text style={styles.userId}>{item.id}</Text>
      </View>
      <TouchableOpacity 
        style={styles.viewButton}
        onPress={() => handleUserPress(item.id)}
      >
        <Text style={styles.viewButtonText}>Xem</Text>
      </TouchableOpacity>
    </TouchableOpacity>
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
          {activeTab === 'followers' ? 'Người quan tâm' : 'Bạn bếp'}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
          onPress={() => setActiveTab('followers')}
        >
          <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
            Người quan tâm ({followers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
            Bạn bếp ({following.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'followers' ? followers : following}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="people-outline" size={60} color="#DDD" />
              <Text style={styles.emptyText}>
                {activeTab === 'followers' 
                  ? 'Chưa có người quan tâm nào' 
                  : 'Chưa kết bạn với bếp nào'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

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
    marginTop: 10, // Thêm margin top để đẩy header xuống
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginTop: 5, // Thêm margin top để đẩy tabs xuống
  },
  tab: {
    flex: 1,
    paddingVertical: 16, // Tăng padding để tạo khoảng cách
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B00',
  },
  tabText: {
    fontSize: 14,
    color: '#777',
  },
  activeTabText: {
    color: '#FF6B00',
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
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10, // Thêm padding top cho danh sách
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16, // Tăng padding để tạo khoảng cách
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userId: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  viewButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60, // Tăng margin top để đẩy nội dung trống xuống
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default SocialConnections;