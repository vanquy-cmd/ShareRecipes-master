import { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  FlatList,
} from "react-native"
import Icon from "react-native-vector-icons/MaterialIcons"
import firestore from "@react-native-firebase/firestore"
import LinearGradient from "react-native-linear-gradient"
import { useMyContextController } from "../store"

const { width } = Dimensions.get("window")

const FriendDetail = ({ route, navigation }) => {
  // Get the userId from route params - this is the profile we're viewing
  const { userId } = route.params

  const [controller] = useMyContextController()
  const { userLogin } = controller
  const currentUserId = userLogin.id // Current logged in user

  const [userProfile, setUserProfile] = useState(null)
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [recipesCount, setRecipesCount] = useState(0)
  const [joinDate, setJoinDate] = useState(null)

  // Hàm để lấy số lượng công thức của người dùng
  const fetchRecipesCount = async (uid) => {
    try {
      // Thử với userId chính xác
      let count = 0
      
      // Kiểm tra với userId đầy đủ
      const recipesSnapshot = await firestore()
        .collection("RECIPES")
        .where("userId", "==", uid)
        .get()
      
      count = recipesSnapshot.size
      
      // Nếu không có kết quả và userId bắt đầu bằng @, thử với userId không có @
      if (count === 0 && uid.startsWith("@")) {
        const altUserId = uid.substring(1) // Bỏ @ ở đầu
        const altRecipesSnapshot = await firestore()
          .collection("RECIPES")
          .where("userId", "==", altUserId)
          .get()
        
        count = altRecipesSnapshot.size
      }
      
      // Nếu vẫn không có kết quả, thử với trường creatorId
      if (count === 0) {
        const creatorRecipesSnapshot = await firestore()
          .collection("RECIPES")
          .where("creatorId", "==", uid)
          .get()
        
        count = creatorRecipesSnapshot.size
      }
      
      // Thử thêm với trường creator (nếu có)
      if (count === 0) {
        const creatorRecipesSnapshot = await firestore()
          .collection("RECIPES")
          .where("creator", "==", uid)
          .get()
        
        count = creatorRecipesSnapshot.size
      }
      
      return count
    } catch (error) {
      console.error("Error counting recipes:", error)
      return 0
    }
  }

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        console.log("FriendDetail: Fetching profile for userId:", userId, "Type:", typeof userId)

        // Fetch user profile data
        const userDoc = await firestore().collection("USERS").doc(userId).get()

        if (userDoc.exists) {
          const userData = userDoc.data()
          setUserProfile(userData)
          
          // Lấy ngày tham gia từ metadata hoặc từ trường createdAt nếu có
          if (userDoc.createTime) {
            setJoinDate(userDoc.createTime.toDate())
          } else if (userData.createdAt) {
            // Nếu có trường createdAt trong dữ liệu người dùng
            const createdAtDate = userData.createdAt instanceof Date 
              ? userData.createdAt 
              : userData.createdAt.toDate ? userData.createdAt.toDate() 
              : new Date(userData.createdAt)
            setJoinDate(createdAtDate)
          }
        } else {
          console.log("User not found")
        }

        // Check if current user is following this profile
        if (userId !== currentUserId) {
          const followDoc = await firestore()
            .collection("USERS")
            .doc(currentUserId)
            .collection("FOLLOWING")
            .doc(userId)
            .get()

          setIsFollowing(followDoc.exists)
        }

        // Get followers count
        const followersSnapshot = await firestore().collection("USERS").doc(userId).collection("FOLLOWERS").get()
        setFollowersCount(followersSnapshot.size)

        // Get following count
        const followingSnapshot = await firestore().collection("USERS").doc(userId).collection("FOLLOWING").get()
        setFollowingCount(followingSnapshot.size)

        // Lấy số lượng công thức
        const recipeCount = await fetchRecipesCount(userId)
        setRecipesCount(recipeCount)
        console.log("Recipe count for user", userId, ":", recipeCount)

        // Fetch user's recipes - try multiple ID formats
        let recipesData = []

        // First try with the exact userId
        const recipesSnapshot = await firestore()
          .collection("RECIPES")
          .where("userId", "==", userId)
          .orderBy("createdAt", "desc")
          .limit(10)
          .get()

        // If no results, try with the ID without the @ symbol
        if (recipesSnapshot.empty && userId.startsWith("@")) {
          const altUserId = userId.substring(1) // Remove the @ symbol
          console.log("Trying alternative userId format:", altUserId)

          const altRecipesSnapshot = await firestore()
            .collection("RECIPES")
            .where("userId", "==", altUserId)
            .orderBy("createdAt", "desc")
            .limit(10)
            .get()

          recipesData = altRecipesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        } else {
          recipesData = recipesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        }

        // If still no results, try a different field that might store the user ID
        if (recipesData.length === 0) {
          console.log("Trying with creatorId field")
          const creatorRecipesSnapshot = await firestore()
            .collection("RECIPES")
            .where("creatorId", "==", userId)
            .orderBy("createdAt", "desc")
            .limit(10)
            .get()

          recipesData = creatorRecipesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        }
        
        // Thử thêm với trường creator (nếu có)
        if (recipesData.length === 0) {
          console.log("Trying with creator field")
          const creatorRecipesSnapshot = await firestore()
            .collection("RECIPES")
            .where("creator", "==", userId)
            .orderBy("createdAt", "desc")
            .limit(10)
            .get()

          recipesData = creatorRecipesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        }

        setRecipes(recipesData)
        console.log("Recipes found:", recipesData.length)

        setLoading(false)
      } catch (error) {
        console.error("Error fetching user profile:", error)
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [userId, currentUserId])

  const toggleFollow = async () => {
    try {
      const followingRef = firestore().collection("USERS").doc(currentUserId).collection("FOLLOWING").doc(userId)

      const followerRef = firestore().collection("USERS").doc(userId).collection("FOLLOWERS").doc(currentUserId)

      if (isFollowing) {
        // Unfollow
        await followingRef.delete()
        await followerRef.delete()
        setFollowersCount((prev) => Math.max(0, prev - 1))
      } else {
        // Follow
        await followingRef.set({
          timestamp: firestore.FieldValue.serverTimestamp(),
        })
        await followerRef.set({
          timestamp: firestore.FieldValue.serverTimestamp(),
        })
        setFollowersCount((prev) => prev + 1)
      }

      setIsFollowing(!isFollowing)
    } catch (error) {
      console.error("Error toggling follow:", error)
    }
  }

  const handleRecipePress = (recipeId) => {
    navigation.navigate("RecipeDetail", { recipeId })
  }

  const formatJoinDate = (date) => {
    if (!date) return "Không có thông tin"
    
    const months = [
      "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
      "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
    ]
    
    return `${months[date.getMonth()]} ${date.getFullYear()}`
  }

  const renderRecipeItem = ({ item }) => (
    <TouchableOpacity style={styles.recipeItem} onPress={() => handleRecipePress(item.id)} activeOpacity={0.8}>
      <Image source={{ uri: item.imageUri }} style={styles.recipeImage} />
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeTitle} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.recipeIngredients} numberOfLines={1}>
          {item.ingredients ? item.ingredients.slice(0, 3).join(", ") : ""}
        </Text>
        <View style={styles.recipeMetaInfo}>
          <View style={styles.recipeMeta}>
            <Icon name="timer" size={14} color="#999" />
            <Text style={styles.recipeMetaText}>{item.cookingTime || "10p"}</Text>
          </View>
          <View style={styles.recipeMeta}>
            <Icon name="people" size={14} color="#999" />
            <Text style={styles.recipeMetaText}>{item.servings || "2"} người</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    )
  }

  if (!userProfile) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={60} color="#FF6B00" />
        <Text style={styles.errorText}>Không tìm thấy thông tin người dùng</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.shareButton} onPress={() => {}} activeOpacity={0.8}>
            <Icon name="share" size={24} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={() => {}} activeOpacity={0.8}>
            <Icon name="more-vert" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <LinearGradient colors={["#333333", "#111111"]} style={styles.profileHeader}>
          <Image
            source={{ uri: userProfile.imageUri || "https://via.placeholder.com/150" }}
            style={styles.profileImage}
          />

          <Text style={styles.profileName}>{userProfile.fullName}</Text>
          <Text style={styles.profileUsername}>
            {userProfile.id || userProfile.fullName.toLowerCase().replace(/\s/g, "")}
          </Text>

          <View style={styles.locationContainer}>
            <Icon name="location-on" size={16} color="#AAA" />
            <Text style={styles.locationText}>{userProfile.address || "Việt Nam"}</Text>
          </View>

          {userProfile.bio && <Text style={styles.bioText}>{userProfile.bio}</Text>}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{recipesCount}</Text>
              <Text style={styles.statLabel}>Công thức</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followersCount}</Text>
              <Text style={styles.statLabel}>Người quan tâm</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followingCount}</Text>
              <Text style={styles.statLabel}>Bạn bếp</Text>
            </View>
          </View>

          {/* Follow Button */}
          {userId !== currentUserId && (
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={toggleFollow}
              activeOpacity={0.8}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? "Bạn bếp" : "Kết bạn bếp"}
              </Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* User Info Card - Thay thế Debug Info */}
        <View style={styles.userInfoCard}>
          <View style={styles.userInfoHeader}>
            <Icon name="person" size={20} color="#FF6B00" />
            <Text style={styles.userInfoTitle}>Thông tin người dùng</Text>
          </View>
          
          <View style={styles.userInfoContent}>
            <View style={styles.userInfoItem}>
              <Icon name="email" size={18} color="#777" />
              <Text style={styles.userInfoLabel}>Email:</Text>
              <Text style={styles.userInfoValue}>{userProfile.email || "Chưa cập nhật"}</Text>
            </View>
            
            <View style={styles.userInfoItem}>
              <Icon name="phone" size={18} color="#777" />
              <Text style={styles.userInfoLabel}>Điện thoại:</Text>
              <Text style={styles.userInfoValue}>{userProfile.phone || "Chưa cập nhật"}</Text>
            </View>
            
            <View style={styles.userInfoItem}>
              <Icon name="calendar-today" size={18} color="#777" />
              <Text style={styles.userInfoLabel}>Tham gia:</Text>
              <Text style={styles.userInfoValue}>{formatJoinDate(joinDate)}</Text>
            </View>
            
            <View style={styles.userInfoItem}>
              <Icon name="restaurant" size={18} color="#777" />
              <Text style={styles.userInfoLabel}>Sở thích:</Text>
              <Text style={styles.userInfoValue}>{userProfile.favorites || "Ẩm thực Việt Nam"}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.viewMoreButton}
            onPress={() => navigation.navigate('UserRecipes', { userId })}
          >
            <Text style={styles.viewMoreButtonText}>Xem tất cả công thức</Text>
            <Icon name="arrow-forward" size={16} color="#FF6B00" />
          </TouchableOpacity>
        </View>

        {/* Recipes Section */}
        <View style={styles.recipesSection}>
          <View style={styles.sectionHeader}>
            <Icon name="restaurant-menu" size={22} color="#FF6B00" />
            <Text style={styles.sectionTitle}>Công thức ({recipesCount})</Text>
            <TouchableOpacity style={styles.searchButton}>
              <Icon name="search" size={22} color="#333" />
            </TouchableOpacity>
          </View>

          {recipes.length > 0 ? (
            <FlatList
              data={recipes}
              renderItem={renderRecipeItem}
              keyExtractor={(item) => item.id || item._id || String(Math.random())}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.noRecipesContainer}>
              <Icon name="restaurant" size={60} color="#DDD" />
              <Text style={styles.noRecipesText}>Chưa có công thức nào</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#555",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#555",
    marginTop: 12,
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    paddingTop: 80,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 12,
  },
  profileUsername: {
    fontSize: 16,
    color: "#CCCCCC",
    marginTop: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#AAAAAA",
    marginLeft: 4,
  },
  bioText: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 16,
    marginHorizontal: 20,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 24,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 12,
    color: "#AAAAAA",
    marginTop: 4,
  },
  followButton: {
    backgroundColor: "#FF6B00",
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 24,
    marginTop: 20,
  },
  followingButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  followButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  followingButtonText: {
    color: "#FFFFFF",
  },
  // User Info Card Styles - Thay thế Debug Info
  userInfoCard: {
    margin: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#FAFAFA",
  },
  userInfoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  userInfoContent: {
    padding: 16,
  },
  userInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  userInfoLabel: {
    fontSize: 14,
    color: "#555",
    marginLeft: 8,
    width: 80,
  },
  userInfoValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#FAFAFA",
  },
  viewMoreButtonText: {
    fontSize: 14,
    color: "#FF6B00",
    fontWeight: "600",
    marginRight: 4,
  },
  // Recipes Section Styles
  recipesSection: {
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  recipeItem: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  recipeImage: {
    width: 120,
    height: 120,
  },
  recipeInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  recipeIngredients: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  recipeMetaInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  recipeMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  recipeMetaText: {
    fontSize: 12,
    color: "#999",
    marginLeft: 4,
  },
  noRecipesContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  noRecipesText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default FriendDetail