"use client"

import React, { useState, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { launchImageLibrary } from "react-native-image-picker"
import "react-native-get-random-values"
import { v4 as uuidv4 } from "uuid"
import { getFirestore, collection, doc, setDoc, serverTimestamp, getDocs } from "@react-native-firebase/firestore"
import storage from "@react-native-firebase/storage"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { useMyContextController } from "../store"
import * as Animatable from "react-native-animatable"
import { StatusBar } from "react-native"

const { width } = Dimensions.get("window")

const AddRecipeScreen = () => {
  const navigation = useNavigation()
  const [controller, dispatch] = useMyContextController()
  const { userLogin } = controller
  const userId = userLogin?.id || ""
  const firestore = getFirestore()
  const RECIPES = collection(firestore, "RECIPES")

  // State management
  const [ingredients, setIngredients] = useState([""])
  const [steps, setSteps] = useState([{ text: "", image: null }])
  const [imageUri, setImageUri] = useState(null)
  const [recipeName, setRecipeName] = useState("")
  const [meaning, setMeaning] = useState("")
  const [servings, setServings] = useState("2")
  const [cookingTime, setCookingTime] = useState("1 tiếng 30 phút")
  const [loading, setLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState("details")
  const [stepImages, setStepImages] = useState(Array(steps.length).fill(null))

  // Animation values
  const scrollViewRef = useRef(null)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(100)).current
  const headerOpacity = useRef(new Animated.Value(0)).current

  // Animate components on mount
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()

    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      Animated.timing(headerOpacity, {
        toValue: 0.95,
        duration: 200,
        useNativeDriver: true,
      }).start()
    })

    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      Animated.timing(headerOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start()
    })

    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [])

  const getNextRecipeId = async () => {
    try {
      const snapshot = await getDocs(RECIPES)
      const ids = snapshot.docs.map((doc) => {
        const data = doc.data()
        return data.idRecipe || ""
      })

      const numericIds = ids
        .filter((id) => id.startsWith("@recipe_"))
        .map((id) => Number.parseInt(id.replace("@recipe_", ""), 10))
        .filter((id) => !isNaN(id))

      const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0
      return `@recipe_${maxId + 1}`
    } catch (error) {
      console.error("Error getting next recipe ID:", error)
      return `@recipe_${Date.now()}`
    }
  }

  const addIngredient = () => {
    setIngredients([...ingredients, ""])
  }

  const addStep = () => {
    setSteps([...steps, { text: "", image: null }])
    setStepImages([...stepImages, null])
  }

  const selectMainImage = () => {
    const options = {
      mediaType: "photo",
      includeBase64: false,
      quality: 0.8,
    }

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log("User cancelled image picker")
      } else if (response.error) {
        console.log("ImagePicker Error: ", response.error)
      } else if (response.assets && response.assets.length > 0) {
        setImageUri(response.assets[0].uri)
      }
    })
  }

  const selectStepImage = (index) => {
    const options = {
      mediaType: "photo",
      includeBase64: false,
      quality: 0.8,
    }

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log("User cancelled image picker")
      } else if (response.error) {
        console.log("ImagePicker Error: ", response.error)
      } else if (response.assets && response.assets.length > 0) {
        const newStepImages = [...stepImages]
        newStepImages[index] = response.assets[0].uri
        setStepImages(newStepImages)

        const newSteps = [...steps]
        newSteps[index].image = response.assets[0].uri
        setSteps(newSteps)
      }
    })
  }

  const validateRecipe = () => {
    if (!recipeName.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên món ăn")
      return false
    }

    if (!imageUri) {
      Alert.alert("Thiếu hình ảnh", "Vui lòng thêm hình ảnh đại diện cho món ăn")
      return false
    }

    if (ingredients.filter((i) => i.trim()).length === 0) {
      Alert.alert("Thiếu nguyên liệu", "Vui lòng thêm ít nhất một nguyên liệu")
      return false
    }

    if (steps.filter((s) => s.text.trim()).length === 0) {
      Alert.alert("Thiếu các bước", "Vui lòng thêm ít nhất một bước hướng dẫn")
      return false
    }

    return true
  }

  const saveRecipe = async () => {
    if (!validateRecipe()) return

    setLoading(true)

    try {
      const newId = await getNextRecipeId()
      const uniqueId = uuidv4()

      // Upload main image
      let mainImageUrl = null
      if (imageUri) {
        const response = await fetch(imageUri)
        const blob = await response.blob()
        const imageRef = storage().ref(`images/${userId}/${uniqueId}_main.jpg`)
        await imageRef.put(blob)
        mainImageUrl = await imageRef.getDownloadURL()
      }

      // Upload step images and update steps with URLs
      const updatedSteps = await Promise.all(
        steps.map(async (step, index) => {
          if (stepImages[index]) {
            const response = await fetch(stepImages[index])
            const blob = await response.blob()
            const imageRef = storage().ref(`images/${userId}/${uniqueId}_step_${index}.jpg`)
            await imageRef.put(blob)
            const imageUrl = await imageRef.getDownloadURL()
            return { ...step, image: imageUrl }
          }
          return step
        }),
      )

      // Filter out empty ingredients
      const filteredIngredients = ingredients.filter((ing) => ing.trim() !== "")

      // Save recipe to Firestore
      await setDoc(doc(RECIPES, uniqueId), {
        idRecipe: newId,
        id: uniqueId,
        name: recipeName,
        meaning,
        servings,
        cookingTime,
        ingredients: filteredIngredients,
        steps: updatedSteps,
        imageUri: mainImageUrl,
        createdAt: serverTimestamp(),
        userId,
      })

      Alert.alert("Thành công", "Công thức đã được lưu thành công!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ])
    } catch (error) {
      console.error("Error adding recipe: ", error)
      Alert.alert("Lỗi", "Không thể lưu công thức. Vui lòng thử lại sau.")
    } finally {
      setLoading(false)
    }
  }

  const handleBackPress = () => {
    Alert.alert("Xác nhận", "Bạn có chắc muốn thoát? Mọi thay đổi sẽ không được lưu.", [
      { text: "Hủy", style: "cancel" },
      { text: "Thoát", onPress: () => navigation.goBack() },
    ])
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case "details":
        return (
          <Animatable.View animation="fadeIn" duration={500}>
            <TouchableOpacity style={styles.imageContainer} onPress={selectMainImage} activeOpacity={0.8}>
              {imageUri ? (
                <>
                  <Image style={styles.image} source={{ uri: imageUri }} />
                  <View style={styles.imageOverlay}>
                    <Icon name="camera" size={24} color="white" />
                    <Text style={styles.imageOverlayText}>Thay đổi ảnh</Text>
                  </View>
                </>
              ) : (
                <View style={styles.placeholderContainer}>
                  <Icon name="camera-plus" size={50} color="#ff9932" />
                  <Text style={styles.addImageText}>Thêm hình đại diện món ăn</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>

              <View style={styles.inputWrapper}>
                <Icon name="food" size={24} color="#ff9932" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Tên món ăn"
                  value={recipeName}
                  onChangeText={setRecipeName}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Icon name="heart" size={24} color="#ff9932" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ý nghĩa khi chia sẻ món ăn"
                  value={meaning}
                  onChangeText={setMeaning}
                  placeholderTextColor="#999"
                  multiline
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputWrapper, styles.halfInput]}>
                  <Icon name="account-group" size={24} color="#ff9932" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Khẩu phần"
                    value={servings}
                    onChangeText={setServings}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={[styles.inputWrapper, styles.halfInput]}>
                  <Icon name="clock-outline" size={24} color="#ff9932" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Thời gian nấu"
                    value={cookingTime}
                    onChangeText={setCookingTime}
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </View>
          </Animatable.View>
        )

      case "ingredients":
        return (
          <Animatable.View animation="fadeIn" duration={500} style={styles.formSection}>
            <Text style={styles.sectionTitle}>Nguyên liệu</Text>

            {ingredients.map((ingredient, index) => (
              <Animatable.View key={index} animation="fadeInUp" delay={index * 100} style={styles.ingredientContainer}>
                <View style={styles.ingredientNumber}>
                  <Text style={styles.ingredientNumberText}>{index + 1}</Text>
                </View>
                <TextInput
                  style={styles.ingredientInput}
                  placeholder="Nhập nguyên liệu"
                  value={ingredient}
                  onChangeText={(text) => {
                    const newIngredients = [...ingredients]
                    newIngredients[index] = text
                    setIngredients(newIngredients)
                  }}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    if (ingredients.length > 1) {
                      const newIngredients = ingredients.filter((_, i) => i !== index)
                      setIngredients(newIngredients)
                    } else {
                      Alert.alert("Thông báo", "Cần có ít nhất một nguyên liệu")
                    }
                  }}
                >
                  <Icon name="delete-outline" size={24} color="#ff5252" />
                </TouchableOpacity>
              </Animatable.View>
            ))}

            <TouchableOpacity style={styles.addButton} onPress={addIngredient} activeOpacity={0.8}>
              <Icon name="plus" size={20} color="white" />
              <Text style={styles.addButtonText}>Thêm nguyên liệu</Text>
            </TouchableOpacity>
          </Animatable.View>
        )

      case "steps":
        return (
          <Animatable.View animation="fadeIn" duration={500} style={styles.formSection}>
            <Text style={styles.sectionTitle}>Các bước thực hiện</Text>

            {steps.map((step, index) => (
              <Animatable.View key={index} animation="fadeInUp" delay={index * 100} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepNumberContainer}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepTitle}>Bước {index + 1}</Text>
                  <TouchableOpacity
                    style={styles.deleteStepButton}
                    onPress={() => {
                      if (steps.length > 1) {
                        const newSteps = steps.filter((_, i) => i !== index)
                        setSteps(newSteps)
                        const newStepImages = stepImages.filter((_, i) => i !== index)
                        setStepImages(newStepImages)
                      } else {
                        Alert.alert("Thông báo", "Cần có ít nhất một bước thực hiện")
                      }
                    }}
                  >
                    <Icon name="delete-outline" size={22} color="#ff5252" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.stepInput}
                  placeholder="Mô tả chi tiết bước thực hiện..."
                  value={step.text}
                  onChangeText={(text) => {
                    const newSteps = [...steps]
                    newSteps[index].text = text
                    setSteps(newSteps)
                  }}
                  multiline
                  placeholderTextColor="#999"
                />

                <TouchableOpacity
                  style={styles.stepImageButton}
                  onPress={() => selectStepImage(index)}
                  activeOpacity={0.8}
                >
                  {stepImages[index] ? (
                    <>
                      <Image source={{ uri: stepImages[index] }} style={styles.stepImagePreview} />
                      <View style={styles.stepImageOverlay}>
                        <Icon name="camera" size={24} color="white" />
                      </View>
                    </>
                  ) : (
                    <>
                      <Icon name="camera-plus" size={24} color="white" />
                      <Text style={styles.stepImageButtonText}>Thêm hình ảnh</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animatable.View>
            ))}

            <TouchableOpacity style={styles.addButton} onPress={addStep} activeOpacity={0.8}>
              <Icon name="plus" size={20} color="white" />
              <Text style={styles.addButtonText}>Thêm bước</Text>
            </TouchableOpacity>
          </Animatable.View>
        )

      default:
        return null
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.container}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              shadowOpacity: headerOpacity,
            },
          ]}
        >
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Tạo công thức mới</Text>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={saveRecipe}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Icon name="content-save-outline" size={18} color="white" />
                  <Text style={styles.saveButtonText}>Lưu</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Navigation Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, currentTab === "details" && styles.activeTab]}
            onPress={() => setCurrentTab("details")}
          >
            <Icon name="information-outline" size={22} color={currentTab === "details" ? "#ff9932" : "#666"} />
            <Text style={[styles.tabText, currentTab === "details" && styles.activeTabText]}>Thông tin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, currentTab === "ingredients" && styles.activeTab]}
            onPress={() => setCurrentTab("ingredients")}
          >
            <Icon name="food-variant" size={22} color={currentTab === "ingredients" ? "#ff9932" : "#666"} />
            <Text style={[styles.tabText, currentTab === "ingredients" && styles.activeTabText]}>Nguyên liệu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, currentTab === "steps" && styles.activeTab]}
            onPress={() => setCurrentTab("steps")}
          >
            <Icon name="format-list-numbered" size={22} color={currentTab === "steps" ? "#ff9932" : "#666"} />
            <Text style={[styles.tabText, currentTab === "steps" && styles.activeTabText]}>Các bước</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {renderTabContent()}
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Action Bar */}
        <Animated.View style={[styles.bottomBar, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.bottomButton}
            onPress={() => {
              if (currentTab === "details") {
                setCurrentTab("ingredients")
              } else if (currentTab === "ingredients") {
                setCurrentTab("steps")
              } else {
                saveRecipe()
              }
            }}
          >
            <Text style={styles.bottomButtonText}>{currentTab === "steps" ? "Lưu công thức" : "Tiếp theo"}</Text>
            <Icon name={currentTab === "steps" ? "check" : "arrow-right"} size={20} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    marginTop:20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  backButton: {
    padding: 8,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff9932",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    elevation: 2,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#ff9932",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  activeTabText: {
    color: "#ff9932",
    fontWeight: "600",
  },
  scrollContent: {
    padding: 16,
  },
  imageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    marginBottom: 16,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  imageOverlayText: {
    color: "white",
    marginLeft: 8,
    fontSize: 14,
  },
  placeholderContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  addImageText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  formSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  inputIcon: {
    padding: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 16,
    color: "#333",
  },
  rowInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    flex: 0.48,
  },
  ingredientContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ingredientNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ff9932",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  ingredientNumberText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  ingredientInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff9932",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
  },
  stepCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  stepNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ff9932",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  stepNumberText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  deleteStepButton: {
    padding: 4,
  },
  stepInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  stepImageButton: {
    height: 120,
    borderRadius: 8,
    backgroundColor: "#ff9932",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  stepImageButtonText: {
    color: "white",
    fontWeight: "500",
    marginTop: 8,
  },
  stepImagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  stepImageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff9932",
    paddingVertical: 14,
    borderRadius: 8,
  },
  bottomButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    marginRight: 8,
  },
})

export default AddRecipeScreen
