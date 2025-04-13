"use client"

import { useEffect } from "react"

import { useRef } from "react"

import { useState } from "react"

import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Share,
  Alert,
} from "react-native"
import { Menu, Divider, Badge } from "react-native-paper"
import firestore from "@react-native-firebase/firestore"
import { useMyContextController } from "../store"
import Icon from "react-native-vector-icons/MaterialIcons"
import { BlurView } from "@react-native-community/blur"
import LinearGradient from "react-native-linear-gradient"

const { width, height } = Dimensions.get("window")

const RecipeDetail = ({ route, navigation }) => {
  const [controller] = useMyContextController()
  const { userLogin } = controller
  const userId = userLogin.id
  const { recipeId } = route.params
  const [recipe, setRecipe] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [authorInfo, setAuthorInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [menuVisible, setMenuVisible] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeTab, setActiveTab] = useState("ingredients")
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const [loadingComments, setLoadingComments] = useState(true)

  const scrollY = useRef(new Animated.Value(0)).current
  const scrollViewRef = useRef(null)

  // Animation values
  const imageHeight = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [350, 60],
    extrapolate: "clamp",
  })

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, 200, 300],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  })

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 250, 300],
    outputRange: [0, 0.5, 1],
    extrapolate: "clamp",
  })

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [0, -300],
    extrapolate: "clamp",
  })

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [200, 300],
    outputRange: [0, 1],
    extrapolate: "clamp",
  })

  const fetchComments = async () => {
    try {
      setLoadingComments(true)
      const commentsSnapshot = await firestore()
        .collection("RECIPES")
        .doc(recipeId)
        .collection("COMMENTS")
        .orderBy("createdAt", "desc")
        .get()

      const commentsData = []

      for (const doc of commentsSnapshot.docs) {
        const commentData = doc.data()

        // Fetch user info for the comment
        const userDoc = await firestore().collection("USERS").doc(commentData.userId).get()

        const userData = userDoc.exists ? userDoc.data() : {}

        // Check if current user has liked this comment
        const likeDoc = await firestore()
          .collection("RECIPES")
          .doc(recipeId)
          .collection("COMMENTS")
          .doc(doc.id)
          .collection("LIKES")
          .doc(userId)
          .get()

        commentsData.push({
          id: doc.id,
          ...commentData,
          userName: userData.fullName || "Unknown User",
          userAvatar: userData.imageUri || "https://via.placeholder.com/100",
          isLiked: likeDoc.exists,
        })
      }

      setComments(commentsData)
      setLoadingComments(false)
    } catch (error) {
      console.error("Error fetching comments:", error)
      setLoadingComments(false)
    }
  }

  const submitComment = async () => {
    if (!commentText.trim()) return

    try {
      setSubmittingComment(true)

      const commentRef = await firestore().collection("RECIPES").doc(recipeId).collection("COMMENTS").add({
        userId,
        text: commentText.trim(),
        createdAt: firestore.FieldValue.serverTimestamp(),
        likes: 0,
      })

      // Add the new comment to the list
      const newComment = {
        id: commentRef.id,
        userId,
        text: commentText.trim(),
        createdAt: new Date(),
        likes: 0,
        userName: userInfo?.fullName || "You",
        userAvatar: userInfo?.imageUri,
        isLiked: false,
      }

      setComments([newComment, ...comments])
      setCommentText("")
      setSubmittingComment(false)
    } catch (error) {
      console.error("Error submitting comment:", error)
      setSubmittingComment(false)
      Alert.alert("Lỗi", "Không thể gửi bình luận. Vui lòng thử lại sau.")
    }
  }

  const toggleLikeComment = async (commentId, isLiked, index) => {
    try {
      const likeRef = firestore()
        .collection("RECIPES")
        .doc(recipeId)
        .collection("COMMENTS")
        .doc(commentId)
        .collection("LIKES")
        .doc(userId)

      const commentRef = firestore().collection("RECIPES").doc(recipeId).collection("COMMENTS").doc(commentId)

      // Update the UI immediately for better UX
      const updatedComments = [...comments]
      updatedComments[index].isLiked = !isLiked
      updatedComments[index].likes = isLiked
        ? Math.max(0, updatedComments[index].likes - 1)
        : updatedComments[index].likes + 1
      setComments(updatedComments)

      // Update in Firestore
      await firestore().runTransaction(async (transaction) => {
        const commentDoc = await transaction.get(commentRef)

        if (!commentDoc.exists) {
          throw "Comment does not exist!"
        }

        const currentLikes = commentDoc.data().likes || 0

        if (isLiked) {
          // Unlike
          transaction.delete(likeRef)
          transaction.update(commentRef, {
            likes: Math.max(0, currentLikes - 1),
          })
        } else {
          // Like
          transaction.set(likeRef, {
            timestamp: firestore.FieldValue.serverTimestamp(),
          })
          transaction.update(commentRef, {
            likes: currentLikes + 1,
          })
        }
      })
    } catch (error) {
      console.error("Error toggling like:", error)
      // Revert UI changes if the operation failed
      fetchComments()
    }
  }

  useEffect(() => {
    const fetchRecipeData = async () => {
      try {
        // Fetch recipe data
        const recipeDoc = await firestore().collection("RECIPES").doc(recipeId).get()

        if (recipeDoc.exists) {
          const recipeData = recipeDoc.data()
          setRecipe(recipeData)

          // Check if recipe is in favorites
          const favDoc = await firestore().collection("USERS").doc(userId).collection("FAVORITES").doc(recipeId).get()

          setIsFavorite(favDoc.exists)

          // Fetch author info
          const authorId = recipeData.userId
          if (authorId) {
            const authorDoc = await firestore().collection("USERS").doc(authorId).get()
            if (authorDoc.exists) {
              setAuthorInfo(authorDoc.data())
            }
          }

          // Fetch comments from Firestore
          fetchComments()
        } else {
          console.log("Recipe not found:", recipeId)
        }

        // Fetch current user info
        const userDoc = await firestore().collection("USERS").doc(userId).get()
        if (userDoc.exists) {
          setUserInfo(userDoc.data())
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        setLoading(false)
      }
    }

    fetchRecipeData()

    // Add to recent viewed
    const addToRecentViewed = async () => {
      try {
        await firestore()
          .collection("RECENT_DISHES")
          .add({
            idDishes: userId,
            dishes: [recipeId],
            timestamp: firestore.FieldValue.serverTimestamp(),
          })
      } catch (error) {
        console.error("Error adding to recent dishes:", error)
      }
    }

    addToRecentViewed()
  }, [recipeId, userId])

  const toggleFavorite = async () => {
    try {
      const favRef = firestore().collection("USERS").doc(userId).collection("FAVORITES").doc(recipeId)

      if (isFavorite) {
        await favRef.delete()
      } else {
        await favRef.set({
          recipeId,
          addedAt: firestore.FieldValue.serverTimestamp(),
        })
      }

      setIsFavorite(!isFavorite)
    } catch (error) {
      console.error("Error toggling favorite:", error)
    }
  }

  const handleEdit = () => navigation.navigate("EditRecipe", { recipeId })
  const handleBackPress = () => navigation.goBack()
  const handleMenuToggle = () => setMenuVisible(!menuVisible)

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Xem công thức "${recipe.name}" trên ứng dụng Món Ngon!`,
        url: `https://monngon.app/recipes/${recipeId}`,
      })
    } catch (error) {
      console.error("Error sharing recipe:", error)
    }
  }

  const handleOptionSelect = (option) => {
    setMenuVisible(false)
    if (option === "addToCollection") {
      navigation.navigate("addToCollection", { recipeId })
    } else if (option === "delete") {
      // Show confirmation dialog
      Alert.alert("Xóa công thức", "Bạn có chắc chắn muốn xóa công thức này?", [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await firestore().collection("RECIPES").doc(recipeId).delete()
              navigation.goBack()
            } catch (error) {
              console.error("Error deleting recipe:", error)
            }
          },
        },
      ])
    } else if (option === "share") {
      handleShare()
    }
  }

  const scrollToSection = (section) => {
    if (scrollViewRef.current) {
      const yOffset = section === "ingredients" ? 400 : section === "steps" ? 600 : 800
      scrollViewRef.current.scrollTo({ y: yOffset, animated: true })
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ""

    const date = timestamp instanceof Date ? timestamp : new Date(timestamp.seconds * 1000)

    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Đang tải công thức...</Text>
      </View>
    )
  }

  if (!recipe) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={60} color="#FF6B00" />
        <Text style={styles.errorText}>Không tìm thấy công thức</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Header with blur effect */}
      <Animated.View style={[styles.headerBlur, { opacity: headerOpacity }]}>
        <BlurView style={styles.absolute} blurType="light" blurAmount={20} />
      </Animated.View>

      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress} activeOpacity={0.7}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <Animated.Text style={[styles.headerTitle, { opacity: headerTitleOpacity }]} numberOfLines={1}>
          {recipe.name}
        </Animated.Text>

        <View style={styles.headerActions}>
          {userId === recipe.userId && (
            <TouchableOpacity style={styles.editButton} onPress={handleEdit} activeOpacity={0.8}>
              <Icon name="edit" size={20} color="#FFF" />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite} activeOpacity={0.8}>
            <Icon
              name={isFavorite ? "favorite" : "favorite-border"}
              size={24}
              color={isFavorite ? "#FF6B00" : "#FFF"}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={handleMenuToggle} activeOpacity={0.8}>
            <Icon name="more-vert" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Recipe Menu */}
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={{ x: width - 40, y: 50 }}
        contentStyle={styles.menuContent}
      >
        <Menu.Item
          onPress={() => handleOptionSelect("addToCollection")}
          title="Thêm vào bộ sưu tập"
          leadingIcon="bookmark-outline"
        />
        <Menu.Item
          onPress={() => handleOptionSelect("share")}
          title="Chia sẻ món này"
          leadingIcon="share-variant-outline"
        />
        <Divider />
        {userId === recipe.userId && (
          <Menu.Item
            onPress={() => handleOptionSelect("delete")}
            title="Xóa món này"
            leadingIcon="delete-outline"
            titleStyle={{ color: "#F44336" }}
          />
        )}
      </Menu>

      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Recipe Image */}
        <Animated.View
          style={[
            styles.imageContainer,
            {
              height: imageHeight,
              opacity: imageOpacity,
            },
          ]}
        >
          <Image source={{ uri: recipe.imageUri }} style={styles.image} resizeMode="cover" />
          <LinearGradient colors={["rgba(0,0,0,0.7)", "transparent", "rgba(0,0,0,0.7)"]} style={styles.imageGradient} />
        </Animated.View>

        {/* Recipe Title and Author */}
        <Animated.View style={[styles.titleContainer, { transform: [{ translateY: titleTranslateY }] }]}>
          <Text style={styles.title}>{recipe.name}</Text>

          <View style={styles.metaContainer}>
            <View style={styles.cookTimeContainer}>
              <Icon name="timer" size={16} color="#FF6B00" />
              <Text style={styles.cookTime}>{recipe.cookingTime || "30 phút"}</Text>
            </View>

            <View style={styles.servingsContainer}>
              <Icon name="people" size={16} color="#FF6B00" />
              <Text style={styles.servings}>{recipe.servings || "4"} phần</Text>
            </View>

            <View style={styles.dateContainer}>
              <Icon name="event" size={16} color="#FF6B00" />
              <Text style={styles.date}>{formatDate(recipe.createdAt)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.authorContainer}
            
            onPress={() => {
              console.log("Navigating to user profile with ID:", recipe.userId);
              navigation.navigate("FriendDetail", { userId: recipe.userId });
            }}
            activeOpacity={0.8}
          >
            <Image source={{ uri: authorInfo?.imageUri }} style={styles.authorAvatar} />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{authorInfo?.fullName}</Text>
              <View style={styles.authorLocation}>
                <Icon name="location-on" size={14} color="#777" />
                <Text style={styles.authorAddress}>{authorInfo?.address || "Việt Nam"}</Text>
              </View>
            </View>
            <Icon name="chevron-right" size={20} color="#777" />
          </TouchableOpacity>

          {recipe.meaning && (
            <View style={styles.meaningContainer}>
              <Text style={styles.meaningText}>{recipe.meaning}</Text>
            </View>
          )}
        </Animated.View>

        {/* Navigation Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "ingredients" && styles.activeTab]}
            onPress={() => {
              setActiveTab("ingredients")
              scrollToSection("ingredients")
            }}
          >
            <Text style={[styles.tabText, activeTab === "ingredients" && styles.activeTabText]}>Nguyên liệu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "steps" && styles.activeTab]}
            onPress={() => {
              setActiveTab("steps")
              scrollToSection("steps")
            }}
          >
            <Text style={[styles.tabText, activeTab === "steps" && styles.activeTabText]}>Cách làm</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "comments" && styles.activeTab]}
            onPress={() => {
              setActiveTab("comments")
              scrollToSection("comments")
            }}
          >
            <Text style={[styles.tabText, activeTab === "comments" && styles.activeTabText]}>Bình luận</Text>
            <Badge style={styles.commentBadge}>{comments.length}</Badge>
          </TouchableOpacity>
        </View>

        {/* Ingredients Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="restaurant" size={22} color="#FF6B00" />
            <Text style={styles.sectionTitle}>Nguyên Liệu</Text>
          </View>

          <View style={styles.ingredientsContainer}>
            {recipe.ingredients &&
              recipe.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Icon name="check-circle" size={18} color="#FF6B00" />
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                </View>
              ))}
          </View>
        </View>

        {/* Steps Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="format-list-numbered" size={22} color="#FF6B00" />
            <Text style={styles.sectionTitle}>Cách Làm</Text>
          </View>

          <View style={styles.stepsContainer}>
            {recipe.steps &&
              recipe.steps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={styles.stepNumberContainer}>
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepText}>{step.text}</Text>
                    {step.imageUri && (
                      <Image source={{ uri: step.imageUri }} style={styles.stepImage} resizeMode="cover" />
                    )}
                  </View>
                </View>
              ))}
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="chat" size={22} color="#FF6B00" />
            <Text style={styles.sectionTitle}>Bình Luận</Text>
          </View>

          <View style={styles.commentsContainer}>
            {loadingComments ? (
              <ActivityIndicator size="small" color="#FF6B00" style={{ padding: 20 }} />
            ) : comments.length > 0 ? (
              comments.map((comment, index) => (
                <View key={comment.id} style={styles.commentItem}>
                  <Image source={{ uri: comment.userAvatar }} style={styles.commentAvatar} />
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentAuthor}>{comment.userName}</Text>
                      <Text style={styles.commentTime}>{formatDate(comment.createdAt)}</Text>
                    </View>
                    <Text style={styles.commentText}>{comment.text}</Text>
                    <View style={styles.commentActions}>
                      <TouchableOpacity
                        style={styles.commentAction}
                        onPress={() => toggleLikeComment(comment.id, comment.isLiked, index)}
                      >
                        <Icon
                          name={comment.isLiked ? "thumb-up" : "thumb-up-off-alt"}
                          size={16}
                          color={comment.isLiked ? "#FF6B00" : "#777"}
                        />
                        <Text style={[styles.commentActionText, comment.isLiked && { color: "#FF6B00" }]}>
                          {comment.likes}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.commentAction}>
                        <Icon name="reply" size={16} color="#777" />
                        <Text style={styles.commentActionText}>Trả lời</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noCommentsText}>Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</Text>
            )}

            <View style={styles.addCommentContainer}>
              <Image source={{ uri: userInfo?.imageUri }} style={styles.commentAvatar} />
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Thêm bình luận..."
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                />
              </View>
              <TouchableOpacity
                style={[styles.sendButton, (!commentText.trim() || submittingComment) && styles.sendButtonDisabled]}
                onPress={submitComment}
                disabled={!commentText.trim() || submittingComment}
              >
                <Icon name="send" size={20} color={!commentText.trim() || submittingComment ? "#AAA" : "#FF6B00"} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>
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
  headerBlur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 1,
  },
  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  favoriteButton: {
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
  menuContent: {
    borderRadius: 12,
    marginTop: 36,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: "100%",
    height: 350,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  titleContainer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cookTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  cookTime: {
    fontSize: 14,
    color: "#555",
    marginLeft: 4,
  },
  servingsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  servings: {
    fontSize: 14,
    color: "#555",
    marginLeft: 4,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  date: {
    fontSize: 14,
    color: "#555",
    marginLeft: 4,
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    marginBottom: 16,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  authorLocation: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  authorAddress: {
    fontSize: 14,
    color: "#777",
    marginLeft: 4,
  },
  meaningContainer: {
    padding: 12,
    backgroundColor: "#FFF9F0",
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#FF6B00",
  },
  meaningText: {
    fontSize: 14,
    color: "#555",
    fontStyle: "italic",
    lineHeight: 20,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    flexDirection: "row",
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#FF6B00",
  },
  tabText: {
    fontSize: 14,
    color: "#555",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  commentBadge: {
    backgroundColor: "#FF6B00",
    marginLeft: 6,
    height: 18,
    minWidth: 18,
    fontSize: 10,
  },
  section: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
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
  },
  ingredientsContainer: {
    backgroundColor: "#FFFFFF",
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  ingredientText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
    flex: 1,
  },
  stepsContainer: {
    backgroundColor: "#FFFFFF",
  },
  stepItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  stepNumberContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FF6B00",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 4,
  },
  stepNumber: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  stepImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: 12,
  },
  commentsContainer: {
    backgroundColor: "#FFFFFF",
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  commentTime: {
    fontSize: 12,
    color: "#999",
  },
  commentText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: "row",
    marginTop: 8,
  },
  commentAction: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  commentActionText: {
    fontSize: 12,
    color: "#777",
    marginLeft: 4,
  },
  noCommentsText: {
    fontSize: 14,
    color: "#777",
    fontStyle: "italic",
    textAlign: "center",
    padding: 16,
  },
  addCommentContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  commentInputContainer: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 20,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  commentInput: {
    fontSize: 14,
    color: "#333",
  },
  bottomSpacing: {
    height: 40,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F8F8",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
})

export default RecipeDetail
