"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  Image,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import Icon from "react-native-vector-icons/MaterialIcons"
import axios from "axios"
import LinearGradient from "react-native-linear-gradient"

const { width, height } = Dimensions.get("window")

const RecipeChatScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { selectedDish, suggestions, initialMessages } = route.params || {}
  
  const [chatInput, setChatInput] = useState("")
  const [chatMessages, setChatMessages] = useState(initialMessages || [])
  const [chatLoading, setChatLoading] = useState(false)
  const chatScrollRef = useRef(null)
  
  const apiKey = "AIzaSyAJ2bcbeRGkJfwovx9pKLw293xHduigyYI"
  const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (chatScrollRef.current && chatMessages.length > 0) {
      setTimeout(() => {
        chatScrollRef.current.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [chatMessages])
  
  // If no initial messages, add a welcome message
  useEffect(() => {
    if (!initialMessages || initialMessages.length === 0) {
      let welcomeMessage = 'Bạn có thể hỏi tôi về khẩu phần ăn'
      
      if (selectedDish) {
        welcomeMessage += ` cho món ${selectedDish.name}, ví dụ: "Khẩu phần cho 2 người là gì?"`
      } else if (suggestions && suggestions.length > 0) {
        welcomeMessage += ` cho các món được đề xuất, ví dụ: "Khẩu phần cho 4 người của món đầu tiên là gì?"`
      } else {
        welcomeMessage += `, ví dụ: "Khẩu phần cho 4 người của món này là gì?"`
      }
      
      setChatMessages([
        {
          type: "system",
          text: welcomeMessage,
        },
      ])
    }
  }, [])

  const cleanRecipeText = (text) => {
    if (!text) return ""

    return text
      .replace(/\*\*/g, "")
      .replace(/##/g, "")
      .replace(/^\* /gm, "")
      .replace(/\n\*\s*/g, "\n")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/^#+ /gm, "")
      .replace(/\n#+\s*/g, "\n")
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage = chatInput.trim()
    setChatInput("")
    setChatLoading(true)

    // Add user message to chat
    setChatMessages((prev) => [...prev, { type: "user", text: userMessage }])

    // Prepare context for the AI
    let context = ""
    if (selectedDish) {
      context = `Món ăn hiện tại: ${selectedDish.name}\nCông thức: ${selectedDish.recipe}\n\n`
    } else if (suggestions && suggestions.length > 0) {
      context = `Các món ăn được đề xuất: ${suggestions.join(", ")}\n\n`
    }

    // Send message to API
    const promptText = `${context}Người dùng hỏi: "${userMessage}"\n\nHãy trả lời câu hỏi của người dùng về khẩu phần ăn, cách điều chỉnh nguyên liệu cho số người khác nhau, hoặc các thông tin dinh dưỡng liên quan. Nếu họ hỏi về khẩu phần cho một số người cụ thể, hãy điều chỉnh lượng nguyên liệu phù hợp và giải thích rõ. Trả lời ngắn gọn, dễ hiểu và thân thiện.`

    const requestData = { contents: [{ parts: [{ text: promptText }] }] }

    try {
      const response = await axios.post(apiURL, requestData, {
        headers: { "Content-Type": "application/json" },
      })

      const aiResponse =
        response.data.candidates[0]?.content?.parts[0]?.text || "Xin lỗi, tôi không thể xử lý yêu cầu này."

      // Add AI response to chat
      setChatMessages((prev) => [...prev, { type: "assistant", text: cleanRecipeText(aiResponse) }])
    } catch (error) {
      console.error("Error in chat", error)
      setChatMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          text: "Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn.",
        },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <LinearGradient colors={["#FF6B00", "#FF8F3F", "#FF6B00"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tư vấn khẩu phần ăn</Text>
        <View style={styles.headerRight} />
      </LinearGradient>
      
      {selectedDish && (
        <View style={styles.dishInfoContainer}>
          <Text style={styles.dishInfoTitle}>Món ăn: {selectedDish.name}</Text>
        </View>
      )}
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={chatScrollRef}
          style={styles.chatMessages}
          contentContainerStyle={styles.chatMessagesContent}
          showsVerticalScrollIndicator={true}
          indicatorStyle="black"
          persistentScrollbar={true}
          onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
        >
          {chatMessages.map((message, index) => (
            <View
              key={index}
              style={[
                styles.chatMessage,
                message.type === "user"
                  ? styles.userMessage
                  : message.type === "system"
                    ? styles.systemMessage
                    : styles.assistantMessage,
              ]}
            >
              <Text style={[styles.chatMessageText, message.type === "system" ? styles.systemMessageText : null]}>
                {message.text}
              </Text>
            </View>
          ))}
          {chatLoading && (
            <View style={styles.chatTypingIndicator}>
              <ActivityIndicator size="small" color="#FF6B00" />
              <Text style={styles.chatTypingText}>Đang trả lời...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.chatInputContainer}>
          <TextInput
            style={styles.chatInputField}
            placeholder="Hỏi về khẩu phần ăn..."
            placeholderTextColor="#999"
            value={chatInput}
            onChangeText={setChatInput}
            multiline
            maxLength={200}
          />
          <TouchableOpacity
            style={[styles.chatSendButton, !chatInput.trim() ? styles.chatSendButtonDisabled : null]}
            onPress={sendChatMessage}
            disabled={!chatInput.trim() || chatLoading}
          >
            <Icon name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerRight: {
    width: 40,
  },
  dishInfoContainer: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  dishInfoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  chatMessages: {
    flex: 1,
    padding: 15,
  },
  chatMessagesContent: {
    paddingBottom: 10,
  },
  chatMessage: {
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
    maxWidth: "85%",
  },
  userMessage: {
    backgroundColor: "#FF6B00",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    backgroundColor: "#F0F0F0",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  systemMessage: {
    backgroundColor: "rgba(255, 107, 0, 0.1)",
    alignSelf: "center",
    borderRadius: 12,
    width: "90%",
  },
  chatMessageText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  systemMessageText: {
    color: "#FF6B00",
    fontStyle: "italic",
    textAlign: "center",
  },
  chatTypingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#F0F0F0",
    padding: 10,
    borderRadius: 18,
    marginBottom: 10,
  },
  chatTypingText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    padding: 10,
    backgroundColor: "#FFFFFF",
  },
  chatInputField: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  chatSendButton: {
    backgroundColor: "#FF6B00",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  chatSendButtonDisabled: {
    backgroundColor: "#FFAA77",
  },
})

export default RecipeChatScreen