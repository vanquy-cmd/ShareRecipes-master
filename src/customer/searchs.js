"use client"

import { useRef, useState, useEffect, useCallback } from "react"
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
  Dimensions,
  SafeAreaView,
  RefreshControl,
  Platform,
  Switch,
} from "react-native"
import { TextInput, IconButton, Chip } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { useMyContextController } from "../store"
import { getFirestore, collection, doc, onSnapshot, getDoc, setDoc, updateDoc } from "@react-native-firebase/firestore"
import Icon from "react-native-vector-icons/MaterialIcons"
import LinearGradient from "react-native-linear-gradient"
import { useTheme } from "../customer/ThemeContext"
import { getColors } from "../customer/ThemeColors"

const { width, height } = Dimensions.get("window")
const CARD_WIDTH = width * 0.42
const STATUS_BAR_HEIGHT = Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 0

const SearchScreen = () => {
  const [controller] = useMyContextController()
  const { userLogin } = controller
  const userId = userLogin.id
  const navigation = useNavigation()
  const slideAnim = useRef(new Animated.Value(-330)).current
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [popularIngredients, setPopularIngredients] = useState([])
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recentDishes, setRecentDishes] = useState([])
  const [categories, setCategories] = useState(["Tất cả", "Món chính", "Món phụ", "Tráng miệng", "Đồ uống"])
  const [selectedCategory, setSelectedCategory] = useState("Tất cả")
  const [refreshing, setRefreshing] = useState(false)

  // Theme integration
  const { isDarkMode, toggleTheme } = useTheme()
  const colors = getColors(isDarkMode)

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current

  const fetchData = useCallback(async () => {
    setRefreshing(true)
    try {
      const firestore = getFirestore()

      // Fetch user data
      const userDoc = await getDoc(doc(firestore, "USERS", userId))
      if (userDoc.exists) {
        setUserInfo(userDoc.data())
      }

      // Fetch recipes
      const recipesSnapshot = await getDoc(collection(firestore, "RECIPES"))
      if (!recipesSnapshot.empty) {
        const ingredients = recipesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setPopularIngredients(ingredients)
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setRefreshing(false)
    }
  }, [userId])

  useEffect(() => {
    const firestore = getFirestore()

    // Lắng nghe thay đổi thông tin người dùng
    const unsubscribeUser = onSnapshot(
      doc(firestore, "USERS", userId),
      (userDoc) => {
        if (userDoc.exists) {
          setUserInfo(userDoc.data())
        } else {
          console.log("Không tìm thấy tài liệu!")
        }
        setLoading(false)
      },
      (error) => {
        console.error(error)
        setLoading(false)
      },
    )

    // Lắng nghe thay đổi cho nguyên liệu phổ biến
    const unsubscribeRecipes = onSnapshot(
      collection(firestore, "RECIPES"),
      (snapshot) => {
        if (!snapshot.empty) {
          const ingredients = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          setPopularIngredients(ingredients)
        } else {
          console.log("Không có nguyên liệu phổ biến nào.")
        }
      },
      (error) => {
        console.error("Lỗi khi lấy nguyên liệu phổ biến: ", error)
      },
    )

    // Lắng nghe thay đổi cho món đã xem gần đây
    const recentDishesRef = doc(firestore, "RECENT_DISHES", userId)
    const unsubscribeRecentDishes = onSnapshot(
      recentDishesRef,
      (docSnap) => {
        if (docSnap.exists) {
          const data = docSnap.data()
          setRecentDishes(data.dishes || [])
        } else {
          setRecentDishes([])
        }
      },
      (error) => {
        console.error("Lỗi khi lấy món đã xem gần đây: ", error)
      },
    )

    // Cleanup function
    return () => {
      unsubscribeUser()
      unsubscribeRecipes()
      unsubscribeRecentDishes()
    }
  }, [userId])

  const updateRecentDishes = async (item) => {
    const firestore = getFirestore()
    try {
      const recentDishesRef = doc(firestore, "RECENT_DISHES", userId)
      const docSnap = await getDoc(recentDishesRef)

      if (!docSnap.exists) {
        await setDoc(recentDishesRef, { dishes: [item.id], idDishes: userId })
      } else {
        const data = docSnap.data()
        if (!data.dishes.includes(item.id)) {
          if (item && item.id) {
            data.dishes.push(item.id)
            await updateDoc(recentDishesRef, { dishes: data.dishes })
          }
        }
      }

      const updatedDocSnap = await getDoc(recentDishesRef)
      if (updatedDocSnap.exists) {
        const updatedData = updatedDocSnap.data()
        const validDishes = updatedData.dishes.filter(
          (dishId) => dishId && popularIngredients.find((ingredient) => ingredient.id === dishId),
        )

        setRecentDishes(
          validDishes
            .map((dishId) => popularIngredients.find((ingredient) => ingredient.id === dishId))
            .filter(Boolean),
        )
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật món đã xem gần đây: ", error)
    }
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => gestureState.dx > 20,
      onPanResponderMove: (evt, gestureState) => {
        slideAnim.setValue(Math.min(0, gestureState.dx))
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 100) {
          toggleDrawer()
        } else {
          closeDrawer()
        }
      },
    }),
  ).current

  const toggleDrawer = () => {
    setIsDrawerOpen(true)
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }

  const closeDrawer = () => {
    setIsDrawerOpen(false)
    Animated.timing(slideAnim, {
      toValue: -330,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!userInfo) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: "red" }]}>Không tìm thấy thông tin người dùng.</Text>
      </SafeAreaView>
    )
  }

  const goToRecipeDetail = (item) => {
    navigation.navigate("RecipeDetail", { recipeId: item.id })
    updateRecentDishes(item)
  }

  const renderIngredientItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.ingredientItem, { backgroundColor: colors.card }]}
      onPress={() => goToRecipeDetail(item)}
      activeOpacity={0.8}
    >
      <ImageBackground
        source={{ uri: item.imageUri }}
        style={styles.ingredientImage}
        imageStyle={styles.imageBackground}
      >
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={styles.gradient}>
          <Text style={styles.ingredientText} numberOfLines={1} ellipsizeMode="tail">
            {item.name}
          </Text>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  )

  const renderRecentDishItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.recentDishItem, { backgroundColor: colors.card }]}
      onPress={() => goToRecipeDetail(item)}
      activeOpacity={0.9}
    >
      <ImageBackground
        source={{ uri: item.imageUri || "https://via.placeholder.com/300" }}
        style={styles.recentDishImage}
        imageStyle={styles.recentDishImageStyle}
      >
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={styles.recentGradient}>
          <Text style={styles.recentDishText} numberOfLines={1} ellipsizeMode="tail">
            {item.name}
          </Text>
          <View style={styles.authorContainer}>
            <Image source={{ uri: userInfo.imageUri }} style={styles.authorAvatar} />
            <Text style={styles.authorName}>{userInfo.fullName}</Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  )

  const renderDrawerItem = (icon, text, screen) => (
    <TouchableOpacity
      onPress={() => {
        closeDrawer()
        navigation.navigate(screen)
      }}
      style={[styles.drawerItem, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "transparent" }]}
    >
      <View style={[styles.drawerIconContainer, { backgroundColor: colors.primaryVariant }]}>
        <Icon name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={[styles.drawerItemText, { color: colors.text }]}>{text}</Text>
    </TouchableOpacity>
  )

  return (
    <>
      <StatusBar backgroundColor="transparent" translucent barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={[styles.container, { backgroundColor: colors.background }]} {...panResponder.panHandlers}>
          {/* Main Header */}
          <View style={[styles.header, { backgroundColor: colors.background }]}>
            <TouchableWithoutFeedback onPress={toggleDrawer}>
              <Image source={{ uri: userInfo.imageUri }} style={styles.avatar} />
            </TouchableWithoutFeedback>
            <Text style={[styles.searchText, { color: colors.text }]}>Tìm Kiếm</Text>
            <View style={styles.headerRight}>
              <IconButton
                icon="bell-outline"
                size={24}
                color={colors.text}
                style={styles.bellIcon}
                onPress={() => navigation.navigate("Notification")}
              />
            </View>
          </View>

          {/* Search Input */}
          <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              style={styles.searchInputContainer}
              onPress={() => navigation.navigate("SearchInHome")}
              activeOpacity={0.7}
            >
              <TextInput
                style={[styles.searchInput, { backgroundColor: colors.surface }]}
                placeholder="Tìm kiếm công thức, nguyên liệu..."
                placeholderTextColor={colors.textTertiary}
                mode="outlined"
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                theme={{ roundness: 12, colors: { text: colors.text } }}
                left={<TextInput.Icon icon="magnify" color={colors.textTertiary} />}
                editable={false}
                pointerEvents="none"
              />
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <Animated.ScrollView
            style={[styles.body, { backgroundColor: colors.background }]}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
            scrollEventThrottle={16}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={fetchData}
                colors={[colors.primary]}
                tintColor={colors.primary}
                progressBackgroundColor={colors.surface}
              />
            }
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
                      { backgroundColor: selectedCategory === item ? colors.primary : colors.surfaceVariant },
                      selectedCategory === item && styles.selectedCategoryChip,
                    ]}
                    textStyle={[
                      styles.categoryChipText,
                      { color: selectedCategory === item ? "#FFFFFF" : colors.textSecondary },
                      selectedCategory === item && styles.selectedCategoryChipText,
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
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Nguyên liệu phổ biến</Text>
                <TouchableOpacity onPress={() => console.log("Xem tất cả")}>
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>Xem tất cả</Text>
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
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Món đã xem gần đây</Text>
                  <TouchableOpacity onPress={() => navigation.navigate("RecentDishesScreen")}>
                    <Text style={[styles.seeAllText, { color: colors.primary }]}>Xem tất cả</Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={recentDishes.slice(0, 4)}
                  renderItem={renderRecentDishItem}
                  keyExtractor={(item, index) => (item.id ? item.id : index.toString())}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentDishesContainer}
                />
              </View>
            )}

            {/* Suggested For You */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Gợi ý cho bạn</Text>
                <TouchableOpacity onPress={() => console.log("Xem tất cả")}>
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>Xem tất cả</Text>
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
              style={[styles.cameraButton, { backgroundColor: colors.secondary }]}
              onPress={() => navigation.navigate("DetectObject")}
              activeOpacity={0.8}
            >
              <Icon name="camera-alt" size={22} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.floatingButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate("AddRecipe")}
              activeOpacity={0.8}
              disabled={isDrawerOpen}
            >
              <Icon name="add" size={26} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Drawer Overlay */}
          {isDrawerOpen && (
            <TouchableWithoutFeedback onPress={closeDrawer}>
              <View style={[styles.overlay, { backgroundColor: colors.overlay }]} />
            </TouchableWithoutFeedback>
          )}

          {/* Drawer */}
          <Animated.View
            style={[
              styles.drawer,
              {
                transform: [{ translateX: slideAnim }],
                backgroundColor: colors.surface,
              },
            ]}
          >
            <View style={[styles.drawerHeader, { backgroundColor: isDarkMode ? colors.surfaceVariant : "#FAFAFA" }]}>
              <TouchableOpacity
                style={styles.drawerProfile}
                onPress={() => {
                  closeDrawer()
                  navigation.navigate("InfoCustomer")
                }}
              >
                <Image source={{ uri: userInfo.imageUri }} style={styles.drawerAvatar} />
                <View style={styles.drawerUserInfo}>
                  <Text style={[styles.drawerUserName, { color: colors.text }]}>{userInfo.fullName}</Text>
                  <Text style={[styles.drawerUserEmail, { color: colors.primary }]}>Xem hồ sơ của bạn</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={[styles.drawerDivider, { backgroundColor: colors.divider }]} />

            <View style={styles.drawerContent}>
              {renderDrawerItem("person-outline", "Bếp Cá Nhân", "InfoCustomer")}
              {renderDrawerItem("notifications-none", "Hoạt Động", "RecentDishesScreen")}
              {renderDrawerItem("bar-chart", "Thống Kê Bếp", "RecentDishesScreen")}
              {renderDrawerItem("access-time", "Món Đã Xem Gần Đây", "RecentDishesScreen")}
              {renderDrawerItem("settings", "Cài đặt", "Stings")}
              {renderDrawerItem("send", "Gửi Phản Hồi", "RecentDishesScreen")}
            </View>

            <View style={[styles.drawerFooter, { borderTopColor: colors.divider }]}>
              <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
                <Icon name={isDarkMode ? "brightness-7" : "brightness-2"} size={22} color={colors.text} />
                <Text style={[styles.themeToggleText, { color: colors.text }]}>Chế độ tối</Text>
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                  trackColor={{ false: "#767577", true: colors.primaryVariant }}
                  thumbColor={isDarkMode ? colors.primary : "#f4f3f4"}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
    zIndex: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  searchText: {
    fontSize: 22,
    fontWeight: "bold",
  },
  bellIcon: {
    margin: 0,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 2,
  },
  searchInputContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  searchInput: {
    height: 46,
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 5,
  },
  categoriesContainer: {
    marginVertical: 12,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    marginRight: 8,
    borderRadius: 20,
    height: 36,
  },
  selectedCategoryChip: {
    // Styles handled dynamically
  },
  categoryChipText: {
    fontSize: 13,
  },
  selectedCategoryChipText: {
    // Styles handled dynamically
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  ingredientColumnWrapper: {
    paddingHorizontal: 12,
    justifyContent: "space-between",
  },
  ingredientItem: {
    width: "48%",
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  ingredientImage: {
    width: "100%",
    height: 150,
    justifyContent: "flex-end",
  },
  imageBackground: {
    borderRadius: 12,
  },
  gradient: {
    height: "50%",
    justifyContent: "flex-end",
    padding: 12,
  },
  ingredientText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  recentDishesContainer: {
    paddingHorizontal: 12,
  },
  recentDishItem: {
    width: CARD_WIDTH,
    height: 200,
    marginHorizontal: 4,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  recentDishImage: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  recentDishImageStyle: {
    borderRadius: 12,
  },
  recentGradient: {
    height: "60%",
    justifyContent: "flex-end",
    padding: 12,
  },
  recentDishText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  authorName: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.9,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  fabContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    flexDirection: "column",
    alignItems: "center",
  },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 300,
    height: "100%",
    zIndex: 3,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  drawerHeader: {
    padding: 16,
    paddingTop: 20,
  },
  drawerProfile: {
    flexDirection: "row",
    alignItems: "center",
  },
  drawerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  drawerUserInfo: {
    marginLeft: 12,
  },
  drawerUserName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  drawerUserEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  drawerDivider: {
    height: 1,
    marginVertical: 8,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 8,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 8,
    marginBottom: 4,
  },
  drawerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  drawerItemText: {
    fontSize: 16,
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  themeToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  themeToggleText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  bottomPadding: {
    height: 80,
  },
  errorText: {
    textAlign: "center",
    fontSize: 18,
    marginTop: 20,
  },
})

export default SearchScreen
