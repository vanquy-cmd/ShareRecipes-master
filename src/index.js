"use client"

import { useState, useRef, useEffect } from "react"
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Alert,
  Modal,
  Animated,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import axios from "axios"
import * as ImagePicker from "expo-image-picker"
import * as FileSystem from "expo-file-system"
import Icon from "react-native-vector-icons/MaterialIcons"
import LinearGradient from "react-native-linear-gradient"
import firestore from "@react-native-firebase/firestore"
import { useMyContextController } from "./store"

const { width, height } = Dimensions.get("window")

const DetectIngredient = () => {
  const navigation = useNavigation()
  const [controller, dispatch] = useMyContextController()
  const { userLogin } = controller
  const userId = userLogin?.id

  const [imageUri, setImageUri] = useState(null)
  const [imageIdentifier, setImageIdentifier] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [selectedDish, setSelectedDish] = useState(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [cachedResult, setCachedResult] = useState(false)
  const [activeTab, setActiveTab] = useState("ingredients") // 'ingredients' or 'steps'
  const [savedRecipes, setSavedRecipes] = useState([])
  const [showSavedRecipes, setShowSavedRecipes] = useState(false)
  const [selectedSavedRecipe, setSelectedSavedRecipe] = useState(null)
  const [userInfo, setUserInfo] = useState(null)

  // Chat functionality
  const [chatMessages, setChatMessages] = useState([])

  // Floating chat bubble
  const [showChatBubble, setShowChatBubble] = useState(false)
  const chatBubbleAnim = useRef(new Animated.Value(0)).current
  const chatBubblePulse = useRef(new Animated.Value(1)).current

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const scrollIndicatorAnim = useRef(new Animated.Value(0)).current
  const scrollY = useRef(new Animated.Value(0)).current

  const apiKey = "AIzaSyAJ2bcbeRGkJfwovx9pKLw293xHduigyYI"
  const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

  const [toast, setToast] = useState({ visible: false, message: "", type: "" })
  const toastAnim = useRef(new Animated.Value(-100)).current

  useEffect(() => {
    if (toast.visible) {
      // Show toast
      Animated.sequence([
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(3000), // Show for 3 seconds
        Animated.timing(toastAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setToast({ ...toast, visible: false })
      })
    }
  }, [toast.visible])

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()

    // Start pulse animation for analyze button
    startPulseAnimation()

    // Start scroll indicator animation
    startScrollIndicatorAnimation()

    // Fetch user info
    fetchUserInfo()
  }, [])

  // Fetch saved recipes from RECIPES1 collection
  useEffect(() => {
    if (userId) {
      const unsubscribe = firestore()
        .collection("RECIPES1")
        .where("userId", "==", userId)
        .onSnapshot(
          (snapshot) => {
            const recipesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
            setSavedRecipes(recipesData)
            console.log(`Fetched ${recipesData.length} saved recipes`)
          },
          (error) => {
            console.error("Error fetching saved recipes:", error)
          },
        )

      return () => unsubscribe()
    }
  }, [userId])

  const fetchUserInfo = async () => {
    if (!userId) return

    try {
      const userDoc = await firestore().collection("USERS").doc(userId).get()
      if (userDoc.exists) {
        setUserInfo(userDoc.data())
      }
    } catch (error) {
      console.error("Error fetching user info:", error)
    }
  }

  // Animation for chat bubble
  useEffect(() => {
    if (showChatBubble) {
      // Animate chat bubble appearance
      Animated.spring(chatBubbleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start()

      // Start pulsing animation for chat bubble
      startChatBubblePulse()
    } else {
      Animated.timing(chatBubbleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }
  }, [showChatBubble])

  const startChatBubblePulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(chatBubblePulse, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(chatBubblePulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }

  const startScrollIndicatorAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scrollIndicatorAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scrollIndicatorAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }

  const cleanRecipeText = (text) => {
    if (!text) return ""

    // Loại bỏ tất cả các dấu ** và ## trong văn bản
    return text
      .replace(/\*\*/g, "") // Loại bỏ dấu **
      .replace(/##/g, "") // Loại bỏ dấu ##
      .replace(/^\* /gm, "") // Loại bỏ dấu * ở đầu dòng
      .replace(/\n\*\s*/g, "\n") // Loại bỏ dấu * sau xuống dòng
      .replace(/\*([^*]+)\*/g, "$1") // Loại bỏ dấu * bao quanh text
      .replace(/^#+ /gm, "") // Loại bỏ dấu # ở đầu dòng (tiêu đề)
      .replace(/\n#+\s*/g, "\n") // Loại bỏ dấu # sau xuống dòng
  }

  // Tạo identifier từ thông tin hình ảnh để làm khóa duy nhất
  const generateImageIdentifier = async (uri) => {
    try {
      // Lấy thông tin cơ bản về file
      const fileInfo = await FileSystem.getInfoAsync(uri)

      // Đọc một phần nhỏ của hình ảnh để tạo identifier
      // Chỉ đọc 10KB đầu tiên để tránh vấn đề với hình ảnh lớn
      const headerBytes = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
        length: 10240, // 10KB
        position: 0,
      })

      // Tạo identifier từ kích thước file và một phần của dữ liệu
      const identifier = `${fileInfo.size}_${headerBytes.substring(0, 100)}`

      // Chuyển đổi identifier thành chuỗi an toàn để sử dụng làm ID document
      const safeIdentifier = Buffer.from(identifier)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "")

      console.log("Generated image identifier:", safeIdentifier.substring(0, 20) + "...")
      return safeIdentifier
    } catch (error) {
      console.error("Error generating image identifier:", error)
      // Fallback: sử dụng timestamp làm identifier
      return `img_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    }
  }

  // Lưu kết quả phân tích vào Firestore
  const saveAnalysisResult = async (identifier, suggestions) => {
    if (!identifier || !userId) return

    try {
      await firestore().collection("ANALYSIS_RESULTS").doc(identifier).set({
        userId,
        suggestions,
        timestamp: firestore.FieldValue.serverTimestamp(),
      })
      console.log("Analysis result saved successfully with ID:", identifier.substring(0, 10) + "...")
    } catch (error) {
      console.error("Error saving analysis result:", error)
    }
  }

  // Kiểm tra xem hình ảnh đã được phân tích trước đó chưa
  const checkCachedAnalysis = async (identifier) => {
    if (!identifier) return null

    try {
      console.log("Checking cache for identifier:", identifier.substring(0, 10) + "...")

      const docSnap = await firestore().collection("ANALYSIS_RESULTS").doc(identifier).get()

      if (docSnap.exists) {
        const data = docSnap.data()
        console.log("Found cached analysis result:", data.suggestions.length, "suggestions")
        setCachedResult(true)
        return data.suggestions
      }

      console.log("No cached result found")
      setCachedResult(false)
      return null
    } catch (error) {
      console.error("Error checking cached analysis:", error)
      setCachedResult(false)
      return null
    }
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri
      setImageUri(uri)
      setCachedResult(false)

      // Tạo identifier cho hình ảnh
      const identifier = await generateImageIdentifier(uri)
      setImageIdentifier(identifier)

      setSuggestions([])
      setSelectedDish(null)
      setChatMessages([])
      setShowChatBubble(false) // Hide chat bubble when new image is selected

      // Animate the new image
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri
      setImageUri(uri)
      setCachedResult(false)

      // Tạo identifier cho hình ảnh
      const identifier = await generateImageIdentifier(uri)
      setImageIdentifier(identifier)

      setSuggestions([])
      setSelectedDish(null)
      setChatMessages([])
      setShowChatBubble(false) // Hide chat bubble when new image is selected

      // Animate the new image
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }

  const analyzeImage = async () => {
    if (!imageUri) {
      alert("Vui lòng chọn hoặc chụp ảnh nguyên liệu!")
      return
    }

    setLoading(true)
    setAnalyzing(true)

    try {
      // Kiểm tra xem hình ảnh đã được phân tích trước đó chưa
      if (imageIdentifier) {
        console.log("Checking cache for image identifier:", imageIdentifier.substring(0, 10) + "...")
        const cachedSuggestions = await checkCachedAnalysis(imageIdentifier)

        if (cachedSuggestions && cachedSuggestions.length > 0) {
          console.log("Using cached result with", cachedSuggestions.length, "suggestions")
          // Sử dụng kết quả đã lưu trong cache
          setSuggestions(cachedSuggestions)
          setShowChatBubble(true)

          // Thêm tin nhắn ban đầu sau khi phân tích
          setChatMessages([
            {
              type: "system",
              text: 'Bạn có thể hỏi tôi về khẩu phần ăn cho các món này, ví dụ: "Khẩu phần cho 4 người của món đầu tiên là gì?"',
            },
          ])

          setLoading(false)
          setAnalyzing(false)
          return
        }
      }

      console.log("No cache found, performing new analysis")
      // Nếu không có kết quả trong cache, thực hiện phân tích mới
      const base64ImageData = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      const requestData = {
        contents: [
          {
            parts: [
              {
                text: "Nhận diện nguyên liệu trong ảnh và chỉ liệt kê tên các món ăn phù hợp. KHÔNG đưa ra bất kỳ giới thiệu nào như 'Đây là một số món ăn phù hợp với nguyên liệu trong ảnh'. Chỉ liệt kê trực tiếp tên món ăn theo định dạng số (1., 2., 3., v.v.)",
              },
              { inlineData: { mimeType: "image/jpeg", data: base64ImageData } },
            ],
          },
        ],
      }

      console.log("Sending API request to Gemini")
      const apiResponse = await axios.post(apiURL, requestData, {
        headers: { "Content-Type": "application/json" },
      })

      const responseText = cleanRecipeText(
        apiResponse.data.candidates[0]?.content?.parts[0]?.text || "Không tìm thấy gợi ý.",
      )

      // Xử lý phản hồi để trích xuất các món ăn
      const lines = responseText
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item)
      const processedSuggestions = []

      for (const line of lines) {
        // Chỉ lấy các dòng bắt đầu bằng số và dấu chấm (ví dụ: "1.", "2.")
        const match = line.match(/^\d+\.\s*(.*)/)
        if (match && !match[1].includes("Đây là") && !match[1].includes("phù hợp với nguyên liệu")) {
          processedSuggestions.push(match[1])
        }
      }

      console.log("Analysis complete, found", processedSuggestions.length, "suggestions")
      setSuggestions(processedSuggestions)

      // Lưu kết quả phân tích vào cơ sở dữ liệu
      if (imageIdentifier && processedSuggestions.length > 0) {
        console.log("Saving analysis result to cache")
        await saveAnalysisResult(imageIdentifier, processedSuggestions)
      }

      // Show chat bubble after analysis is complete
      setShowChatBubble(true)

      // Add initial chat message after analysis
      if (processedSuggestions.length > 0) {
        setChatMessages([
          {
            type: "system",
            text: 'Bạn có thể hỏi tôi về khẩu phần ăn cho món này, ví dụ: "Khẩu phần cho 2 người là gì?"',
          },
        ])
      }
    } catch (error) {
      console.error("Error analyzing image", error)
      alert(`Lỗi: ${error.response?.data?.error?.message || "Có lỗi xảy ra"}`)
    } finally {
      setLoading(false)
      setAnalyzing(false)
    }
  }

  // Lưu công thức món ăn vào cơ sở dữ liệu
  const saveRecipeToDatabase = async (dishName, recipeText) => {
    if (!userId || !dishName || !recipeText) return

    try {
      // Check if the recipe already exists in the database
      const recipeName = dishName.toLowerCase().trim()
      const existingRecipesSnapshot = await firestore()
        .collection("RECIPES1")
        .where("userId", "==", userId)
        .where("name", "==", dishName)
        .limit(1)
        .get()

      if (!existingRecipesSnapshot.empty) {
        // Recipe already exists
        showToast("Món ăn này đã có trong kho của bạn", "info")
        return
      }

      // Tạo ID duy nhất cho công thức
      const recipeId = `recipe_${dishName.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}`

      // Tạo URL hình ảnh mẫu nếu không có hình ảnh thực
      const sampleImageUrl =
        "https://firebasestorage.googleapis.com/v0/b/cookingapp-d4e9c.appspot.com/o/recipe_images%2Fdefault_recipe.jpg?alt=media"

      await firestore()
        .collection("RECIPES1") // Đổi từ RECIPES1 sang RECIPES để khớp với RecipeStorageScreen
        .doc(recipeId)
        .set({
          id: recipeId, // Thêm trường id để khớp với cách RecipeStorageScreen đang sử dụng
          idRecipe: recipeId,
          name: dishName,
          recipe: recipeText,
          createdAt: firestore.FieldValue.serverTimestamp(),
          userId: userId,
          isFavorite: true, // Đánh dấu là món ăn yêu thích
          imageUri: imageUri || sampleImageUrl, // Sử dụng hình ảnh đã phân tích hoặc hình mẫu
          timestamp: Date.now(), // Thêm timestamp để sắp xếp theo thời gian
          cookTime: "30 phút", // Thời gian nấu mặc định
          likes: 0, // Số lượt thích ban đầu
        })

      console.log("Recipe saved successfully to RECIPES collection")
      showToast("Đã lưu công thức vào kho món ăn của bạn")
    } catch (error) {
      console.error("Error saving recipe:", error)
      Alert.alert("Lỗi", "Không thể lưu công thức. Vui lòng thử lại sau.")
    }
  }

  const fetchRecipeDetails = async (dishName) => {
    setLoading(true)
    const promptText = `Cung cấp công thức chi tiết cho món ăn ${dishName}. 
    Chia thành 2 phần rõ ràng: 
    1. Nguyên liệu: Liệt kê từng nguyên liệu trên một dòng riêng với định lượng cụ thể.
    2. Cách làm: Liệt kê các bước làm theo số thứ tự, mỗi bước trên một dòng riêng.
    Hãy viết ngắn gọn, rõ ràng và dễ hiểu.`

    const requestData = { contents: [{ parts: [{ text: promptText }] }] }

    try {
      const response = await axios.post(apiURL, requestData, {
        headers: { "Content-Type": "application/json" },
      })

      const recipeText = response.data.candidates[0]?.content?.parts[0]?.text || "Không tìm thấy công thức."
      const cleanedRecipeText = cleanRecipeText(recipeText)

      // Parse recipe to extract ingredients and steps
      const parsedRecipe = parseRecipeContent(cleanedRecipeText)

      setSelectedDish({
        name: dishName,
        recipe: cleanedRecipeText,
        ingredients: parsedRecipe.ingredients,
        steps: parsedRecipe.steps,
      })
      setActiveTab("ingredients") // Default to ingredients tab

      // Show chat bubble when recipe details are fetched
      setShowChatBubble(true)

      // Reset chat when selecting a new dish
      setChatMessages([
        {
          type: "system",
          text: `Bạn có thể hỏi tôi về khẩu phần ăn cho món ${dishName}, ví dụ: "Khẩu phần cho 2 người là gì?"`,
        },
      ])
    } catch (error) {
      console.error("Error fetching recipe", error)
      alert("Lỗi khi lấy công thức món ăn.")
    } finally {
      setLoading(false)
    }
  }

  // Fetch saved recipe details from RECIPES1 collection
  const fetchSavedRecipeDetails = async (recipeId) => {
    setLoading(true)
    try {
      const recipeDoc = await firestore().collection("RECIPES1").doc(recipeId).get()

      if (recipeDoc.exists) {
        const recipeData = recipeDoc.data()

        // Parse recipe to extract ingredients and steps
        const parsedRecipe = parseRecipeContent(recipeData.recipe)

        setSelectedSavedRecipe({
          ...recipeData,
          ingredients: parsedRecipe.ingredients,
          steps: parsedRecipe.steps,
        })

        setActiveTab("ingredients") // Default to ingredients tab
      } else {
        Alert.alert("Lỗi", "Không tìm thấy công thức món ăn.")
      }
    } catch (error) {
      console.error("Error fetching saved recipe:", error)
      Alert.alert("Lỗi", "Không thể tải công thức món ăn.")
    } finally {
      setLoading(false)
    }
  }

  // Parse recipe content to separate ingredients and steps
  const parseRecipeContent = (recipeText) => {
    if (!recipeText) return { ingredients: [], steps: [] }

    // Split by lines and remove empty lines
    const lines = recipeText.split("\n").filter((line) => line.trim())

    // Find where ingredients section starts and ends
    let ingredientsStartIndex = lines.findIndex(
      (line) => line.toLowerCase().includes("nguyên liệu") || line.toLowerCase().includes("ingredients"),
    )

    // If no explicit "Nguyên liệu" heading, start from the beginning
    if (ingredientsStartIndex === -1) ingredientsStartIndex = 0
    else ingredientsStartIndex += 1 // Skip the heading line

    // Find where steps section starts
    let stepsStartIndex = lines.findIndex(
      (line, index) =>
        index > ingredientsStartIndex &&
        (line.toLowerCase().includes("cách làm") ||
          line.toLowerCase().includes("hướng dẫn") ||
          line.toLowerCase().includes("các bước") ||
          line.toLowerCase().includes("steps") ||
          line.toLowerCase().includes("instructions")),
    )

    // If no explicit "Cách làm" heading, estimate based on line format
    if (stepsStartIndex === -1) {
      // Look for numbered lines which likely indicate steps
      stepsStartIndex = lines.findIndex(
        (line, index) => index > ingredientsStartIndex && (line.match(/^\d+[.)]/) || line.match(/^Bước \d+/)),
      )

      // If still not found, use the first long line as a heuristic
      if (stepsStartIndex === -1) {
        stepsStartIndex = lines.findIndex((line, index) => index > ingredientsStartIndex && line.length > 80)
      }

      // If all else fails, split in the middle
      if (stepsStartIndex === -1) {
        stepsStartIndex = Math.floor(lines.length / 2)
      }
    } else {
      stepsStartIndex += 1 // Skip the heading line
    }

    // Extract ingredients and steps
    const ingredientsLines = lines.slice(ingredientsStartIndex, stepsStartIndex)
    const stepsLines = lines.slice(stepsStartIndex)

    // Process ingredients to ensure each is on its own line and has proper formatting
    const ingredients = ingredientsLines
      .map((line) => {
        // Clean up the line
        return line
          .trim()
          .replace(/^[-•*]\s*/, "") // Remove bullet points
          .replace(/^[0-9]+\.\s*/, "") // Remove numbering
      })
      .filter((line) => line.length > 0)

    // Process steps to ensure proper formatting and remove any numbering
    const steps = stepsLines
      .map((line) => {
        // Clean up the line and remove any numbering
        return line
          .trim()
          .replace(/^[-•*]\s*/, "") // Remove bullet points
          .replace(/^[0-9]+[.)]\s*/, "") // Remove "1.", "2.", etc.
          .replace(/^Bước\s+\d+[:.]\s*/i, "") // Remove "Bước 1:", "Bước 2:", etc.
      })
      .filter((line) => line.length > 0)

    return { ingredients, steps }
  }

  // Navigate to chat screen
  const navigateToChatScreen = () => {
    // Prepare data to pass to the chat screen
    const chatData = {
      selectedDish: selectedDish,
      suggestions: suggestions,
      initialMessages: chatMessages,
    }

    // Navigate to the chat screen with the data
    navigation.navigate("RecipeChatScreen", chatData)
  }

  const renderImagePlaceholder = () => (
    <View style={styles.imagePlaceholder}>
      <Icon name="image" size={80} color="#FFFFFF" style={{ opacity: 0.7 }} />
      <Text style={styles.placeholderText}>Chọn hoặc chụp ảnh nguyên liệu</Text>
    </View>
  )

  // Render chat bubble
  const renderChatBubble = () => {
    if (!showChatBubble) return null

    return (
      <Animated.View
        style={[
          styles.chatBubble,
          {
            opacity: chatBubbleAnim,
            transform: [
              { scale: chatBubblePulse },
              {
                translateY: chatBubbleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity style={styles.chatBubbleButton} onPress={navigateToChatScreen} activeOpacity={0.8}>
          <View style={styles.chatBubbleContent}>
            <Icon name="chat" size={24} color="#FFFFFF" />
            <View style={styles.chatBubbleTextContainer}>
              <Text style={styles.chatBubbleText}>Hỏi về khẩu phần ăn</Text>
              <Text style={styles.chatBubbleSubtext}>Nhấn để tư vấn</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  // Render recipe modal
  const renderRecipeModal = () => {
    if (!selectedDish) return null

    return (
      <Modal
        visible={!!selectedDish}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedDish(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Recipe Header */}
            <View style={styles.recipeHeader}>
              <Text style={styles.recipeTitle}>{selectedDish.name}</Text>
              <View style={styles.recipeHeaderButtons}>
                <TouchableOpacity
                  onPress={() => saveRecipeToDatabase(selectedDish.name, selectedDish.recipe)}
                  style={styles.saveButton}
                >
                  <Icon name="bookmark" size={20} color="#FF6B00" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelectedDish(null)} style={styles.closeButton}>
                  <Icon name="close" size={24} color="#777" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === "ingredients" && styles.activeTab]}
                onPress={() => setActiveTab("ingredients")}
              >
                <Text style={[styles.tabText, activeTab === "ingredients" && styles.activeTabText]}>Nguyên liệu</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "steps" && styles.activeTab]}
                onPress={() => setActiveTab("steps")}
              >
                <Text style={[styles.tabText, activeTab === "steps" && styles.activeTabText]}>Cách làm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "comments" && styles.activeTab]}
                onPress={() => setActiveTab("comments")}
              >
                <Text style={[styles.tabText, activeTab === "comments" && styles.activeTabText]}>Bình luận</Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
            >
              {activeTab === "ingredients" && (
                <View style={styles.tabContent}>
                  <View style={styles.ingredientsHeader}>
                    <Icon name="restaurant" size={24} color="#FF6B00" />
                    <Text style={styles.ingredientsTitle}>Nguyên Liệu</Text>
                  </View>
                  {selectedDish.ingredients &&
                    selectedDish.ingredients.map((ingredient, index) => (
                      <View key={index} style={styles.ingredientItem}>
                        <View style={styles.checkmarkContainer}>
                          <Icon name="check-circle" size={20} color="#FF6B00" />
                        </View>
                        <Text style={styles.ingredientText}>{ingredient}</Text>
                      </View>
                    ))}
                </View>
              )}

              {activeTab === "steps" && (
                <View style={styles.tabContent}>
                  <Text style={styles.stepsTitle}>Cách Làm</Text>
                  {selectedDish.steps &&
                    selectedDish.steps.map((step, index) => (
                      <View key={index} style={styles.stepItem}>
                        <View style={styles.numberContainer}>
                          <Text style={styles.stepNumber}>{index + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                </View>
              )}

              {activeTab === "comments" && (
                <View style={styles.tabContent}>
                  <Text style={styles.commentText}>Chưa có bình luận nào.</Text>
                </View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setSelectedDish(null)}
                style={styles.backToListButton}
                activeOpacity={0.8}
              >
                <Icon name="arrow-back" size={20} color="#FFFFFF" />
                <Text style={styles.backToListText}>Quay lại danh sách món</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    )
  }

  // Render saved recipe modal
  const renderSavedRecipeModal = () => {
    if (!selectedSavedRecipe) return null

    return (
      <Modal
        visible={!!selectedSavedRecipe}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedSavedRecipe(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Recipe Header */}
            <View style={styles.recipeHeader}>
              <Text style={styles.recipeTitle}>{selectedSavedRecipe.name}</Text>
              <View style={styles.recipeHeaderButtons}>
                <TouchableOpacity onPress={() => setSelectedSavedRecipe(null)} style={styles.closeButton}>
                  <Icon name="close" size={24} color="#777" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === "ingredients" && styles.activeTab]}
                onPress={() => setActiveTab("ingredients")}
              >
                <Text style={[styles.tabText, activeTab === "ingredients" && styles.activeTabText]}>Nguyên liệu</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "steps" && styles.activeTab]}
                onPress={() => setActiveTab("steps")}
              >
                <Text style={[styles.tabText, activeTab === "steps" && styles.activeTabText]}>Cách làm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "comments" && styles.activeTab]}
                onPress={() => setActiveTab("comments")}
              >
                <Text style={[styles.tabText, activeTab === "comments" && styles.activeTabText]}>Bình luận</Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
            >
              {activeTab === "ingredients" && (
                <View style={styles.tabContent}>
                  <View style={styles.ingredientsHeader}>
                    <Icon name="restaurant" size={24} color="#FF6B00" />
                    <Text style={styles.ingredientsTitle}>Nguyên Liệu</Text>
                  </View>
                  {selectedSavedRecipe.ingredients &&
                    selectedSavedRecipe.ingredients.map((ingredient, index) => (
                      <View key={index} style={styles.ingredientItem}>
                        <View style={styles.checkmarkContainer}>
                          <Icon name="check-circle" size={20} color="#FF6B00" />
                        </View>
                        <Text style={styles.ingredientText}>{ingredient}</Text>
                      </View>
                    ))}
                </View>
              )}

              {activeTab === "steps" && (
                <View style={styles.tabContent}>
                  <Text style={styles.stepsTitle}>Cách Làm</Text>
                  {selectedSavedRecipe.steps &&
                    selectedSavedRecipe.steps.map((step, index) => (
                      <View key={index} style={styles.stepItem}>
                        <View style={styles.numberContainer}>
                          <Text style={styles.stepNumber}>{index + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                </View>
              )}

              {activeTab === "comments" && (
                <View style={styles.tabContent}>
                  <Text style={styles.commentText}>Chưa có bình luận nào.</Text>
                </View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setSelectedSavedRecipe(null)}
                style={styles.backToListButton}
                activeOpacity={0.8}
              >
                <Icon name="arrow-back" size={20} color="#FFFFFF" />
                <Text style={styles.backToListText}>Quay lại</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    )
  }

  // Render saved recipes modal
  const renderSavedRecipesModal = () => {
    return (
      <Modal
        visible={showSavedRecipes}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSavedRecipes(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: height * 0.8 }]}>
            <View style={styles.recipeHeader}>
              <Text style={styles.recipeTitle}>Kho món ngon của bạn</Text>
              <TouchableOpacity onPress={() => setShowSavedRecipes(false)} style={styles.closeButton}>
                <Icon name="close" size={24} color="#777" />
              </TouchableOpacity>
            </View>

            {savedRecipes.length > 0 ? (
              <Animated.FlatList
                data={savedRecipes}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: 20 }}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                  useNativeDriver: true,
                })}
                renderItem={({ item, index }) => (
                  <Animated.View
                    style={[
                      styles.savedRecipeItem,
                      {
                        transform: [
                          {
                            scale: scrollY.interpolate({
                              inputRange: [-100, 0, 100 * index, 100 * (index + 2)],
                              outputRange: [1, 1, 1, 0.95],
                              extrapolate: "clamp",
                            }),
                          },
                        ],
                        opacity: scrollY.interpolate({
                          inputRange: [100 * (index - 1), 100 * index, 100 * (index + 1)],
                          outputRange: [1, 1, 0.7],
                          extrapolate: "clamp",
                        }),
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.savedRecipeCard}
                      onPress={() => {
                        setShowSavedRecipes(false)
                        fetchSavedRecipeDetails(item.id)
                      }}
                      activeOpacity={0.9}
                    >
                      <Image source={{ uri: item.imageUri }} style={styles.savedRecipeImage} resizeMode="cover" />
                      <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} style={styles.savedRecipeGradient}>
                        <View style={styles.savedRecipeInfo}>
                          <Text style={styles.savedRecipeTitle} numberOfLines={2}>
                            {item.name}
                          </Text>
                          <View style={styles.savedRecipeMetaContainer}>
                            <View style={styles.savedRecipeUserInfo}>
                              {userInfo && (
                                <>
                                  <Image source={{ uri: userInfo.imageUri }} style={styles.savedRecipeAvatar} />
                                  <Text style={styles.savedRecipeUserName}>{userInfo.fullName}</Text>
                                </>
                              )}
                            </View>
                            <View style={styles.savedRecipeStats}>
                              <Icon name="timer" size={16} color="#FFF" />
                              <Text style={styles.savedRecipeStatText}>{item.cookTime || "30 phút"}</Text>
                              <Icon name="favorite" size={16} color="#FFF" style={{ marginLeft: 8 }} />
                              <Text style={styles.savedRecipeStatText}>{item.likes || 0}</Text>
                            </View>
                          </View>
                        </View>
                      </LinearGradient>
                      {item.isFavorite && (
                        <View style={styles.savedRecipeFavoriteIcon}>
                          <Icon name="favorite" size={20} color="#FF6B00" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                )}
              />
            ) : (
              <View style={styles.emptyRecipesContainer}>
                <Icon name="restaurant" size={60} color="#DDDDDD" />
                <Text style={styles.emptyRecipesText}>Bạn chưa có món ăn nào được lưu</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    )
  }

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type })
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ImageBackground source={require("./asset/4.png")} style={styles.background} resizeMode="cover">
        <LinearGradient colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.7)"]} style={styles.gradient}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Animated.View
                style={[
                  styles.headerContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <Text style={styles.title}>Phát hiện nguyên liệu</Text>
                <Text style={styles.subtitle}>Chụp ảnh nguyên liệu để nhận gợi ý món ăn</Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.contentContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                {imageUri ? (
                  <Animated.View style={{ opacity: fadeAnim }}>
                    <Image source={{ uri: imageUri }} style={styles.image} />
                    {cachedResult && (
                      <View style={styles.cachedBadge}>
                        <Icon name="cached" size={14} color="#FFFFFF" />
                        <Text style={styles.cachedText}>Đã phân tích trước đó</Text>
                      </View>
                    )}
                  </Animated.View>
                ) : (
                  renderImagePlaceholder()
                )}

                <View style={styles.buttonContainer}>
                  <TouchableOpacity onPress={pickImage} style={styles.button} activeOpacity={0.8}>
                    <Icon name="photo-library" size={22} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Thư viện</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={takePhoto} style={styles.button} activeOpacity={0.8}>
                    <Icon name="camera-alt" size={22} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Chụp ảnh</Text>
                  </TouchableOpacity>
                </View>

                <Animated.View
                  style={{
                    transform: [{ scale: imageUri ? pulseAnim : 1 }],
                  }}
                >
                  <TouchableOpacity
                    onPress={analyzeImage}
                    style={[styles.analyzeButton, analyzing && styles.analyzingButton]}
                    activeOpacity={0.8}
                    disabled={analyzing || !imageUri}
                  >
                    {analyzing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Icon name="search" size={22} color="#FFFFFF" />
                        <Text style={styles.analyzeButtonText}>
                          {imageUri ? "Phân tích nguyên liệu" : "Phân tích nguyên liệu"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* Saved Recipes Button */}
                <TouchableOpacity
                  onPress={() => setShowSavedRecipes(true)}
                  style={styles.savedRecipesButton}
                  activeOpacity={0.8}
                >
                  <Icon name="book" size={22} color="#FFFFFF" />
                  <Text style={styles.savedRecipesButtonText}>Xem kho món ngon của bạn</Text>
                </TouchableOpacity>

                {loading && !analyzing && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF6B00" />
                    <Text style={styles.loadingText}>Đang xử lý...</Text>
                  </View>
                )}

                {suggestions.length > 0 && (
                  <View style={styles.suggestionContainer}>
                    <View style={styles.suggestionHeader}>
                      <Icon name="restaurant" size={24} color="#FF6B00" />
                      <Text style={styles.suggestionTitle}>Gợi ý món ăn</Text>
                    </View>

                    {suggestions.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.dishItem}
                        onPress={() => fetchRecipeDetails(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dishNumber}>{index + 1}</Text>
                        <Text style={styles.dishText}>{item}</Text>
                        <Icon name="chevron-right" size={24} color="#FF6B00" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Floating chat bubble */}
          {renderChatBubble()}

          {/* Recipe Modal */}
          {renderRecipeModal()}

          {/* Saved Recipe Modal */}
          {renderSavedRecipeModal()}

          {/* Saved Recipes List Modal */}
          {renderSavedRecipesModal()}

          {/* Toast Notification */}
          {toast.visible && (
            <Animated.View
              style={[
                styles.toast,
                toast.type === "success"
                  ? styles.successToast
                  : toast.type === "error"
                    ? styles.errorToast
                    : styles.infoToast,
                { transform: [{ translateY: toastAnim }] },
              ]}
            >
              <View style={styles.toastContent}>
                <Icon
                  name={toast.type === "success" ? "check-circle" : toast.type === "error" ? "error" : "info"}
                  size={24}
                  color="#FFFFFF"
                />
                <Text style={styles.toastText}>{toast.message}</Text>
              </View>
            </Animated.View>
          )}
        </LinearGradient>
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  gradient: {
    flex: 1,
    paddingTop: 50,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.8,
    textAlign: "center",
  },
  contentContainer: {
    alignItems: "center",
    width: "100%",
  },
  imagePlaceholder: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderStyle: "dashed",
    marginBottom: 20,
  },
  placeholderText: {
    color: "#FFFFFF",
    marginTop: 10,
    fontSize: 16,
    opacity: 0.8,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#FF6B00",
  },
  cachedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 150, 0, 0.8)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  cachedText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#FF6B00",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "48%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  analyzeButton: {
    backgroundColor: "#FF6B00",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  analyzingButton: {
    backgroundColor: "#FF8F3F",
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginRight: 40,
  },
  savedRecipesButton: {
    backgroundColor: "rgba(255, 107, 0, 0.8)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  savedRecipesButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 10,
    fontSize: 16,
  },
  suggestionContainer: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  suggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingBottom: 10,
  },
  suggestionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
  },
  dishItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  dishNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B00",
    marginRight: 10,
    width: 25,
  },
  dishText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    marginBottom: 10,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  recipeHeaderButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  saveButton: {
    padding: 5,
    marginRight: 10,
  },
  closeButton: {
    padding: 5,
  },
  // Tab styles
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#FF6B00",
  },
  tabText: {
    fontSize: 14,
    color: "#777777",
  },
  activeTabText: {
    color: "#FF6B00",
    fontWeight: "bold",
  },
  tabContent: {
    paddingBottom: 20,
  },
  modalScrollView: {
    maxHeight: height * 0.5,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  // Ingredients styles
  ingredientsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  ingredientsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B00",
    marginLeft: 10,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 5,
  },
  checkmarkContainer: {
    width: 30,
    alignItems: "center",
  },
  ingredientText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  // Steps styles
  stepsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B00",
    marginBottom: 15,
  },
  stepItem: {
    flexDirection: "row",
    marginBottom: 15,
    paddingRight: 10,
  },
  numberContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FF6B00",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginTop: 2,
  },
  stepNumber: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  stepText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    lineHeight: 22,
  },
  // Comments styles
  commentText: {
    fontSize: 16,
    color: "#777",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 20,
  },
  // Modal footer
  modalFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  backToListButton: {
    backgroundColor: "#FF6B00",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backToListText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  // Chat bubble styles
  chatBubble: {
    position: "absolute",
    bottom: 30,
    right: 20,
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  chatBubbleButton: {
    backgroundColor: "#FF6B00",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  chatBubbleContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  chatBubbleTextContainer: {
    marginLeft: 10,
  },
  chatBubbleText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  chatBubbleSubtext: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.8,
  },
  // Saved recipes styles
  savedRecipeItem: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  savedRecipeCard: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
  },
  savedRecipeImage: {
    width: "100%",
    height: "100%",
  },
  savedRecipeGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    justifyContent: "flex-end",
    padding: 16,
  },
  savedRecipeInfo: {
    justifyContent: "flex-end",
  },
  savedRecipeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  savedRecipeMetaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  savedRecipeUserInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  savedRecipeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  savedRecipeUserName: {
    fontSize: 12,
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  savedRecipeStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  savedRecipeStatText: {
    fontSize: 12,
    color: "#FFFFFF",
    marginLeft: 4,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  savedRecipeFavoriteIcon: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyRecipesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyRecipesText: {
    fontSize: 16,
    color: "#777",
    marginTop: 12,
    textAlign: "center",
  },
  toast: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    zIndex: 9999,
  },
  successToast: {
    backgroundColor: "rgba(76, 175, 80, 0.9)",
  },
  errorToast: {
    backgroundColor: "rgba(244, 67, 54, 0.9)",
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  infoToast: {
    backgroundColor: "rgba(33, 150, 243, 0.9)",
  },
})

export default DetectIngredient
