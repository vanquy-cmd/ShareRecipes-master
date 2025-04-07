import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TextInput, 
  TouchableOpacity, 
  StatusBar,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from 'react-native-vector-icons';
import firestore from '@react-native-firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMyContextController } from "../store";
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ChatScreen = ({ route, navigation }) => {
  const [controller] = useMyContextController();
  const { userLogin } = controller;
  const userId = userLogin.id;
  const { receiverId, receiverName } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [receiverInfo, setReceiverInfo] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const attachmentHeight = useRef(new Animated.Value(0)).current;
  
  // Animation for header opacity based on scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (!userId || !receiverId) {
      console.error('User ID or Receiver ID is not valid');
      return;
    }
    
    // Fetch receiver information
    const fetchReceiverInfo = async () => {
      try {
        const receiverDoc = await firestore().collection('USERS').doc(receiverId).get();
        if (receiverDoc.exists) {
          setReceiverInfo(receiverDoc.data());
          // Simulate online status for demo
          setIsOnline(Math.random() > 0.3);
        }
      } catch (error) {
        console.error('Error fetching receiver info:', error);
      }
    };
    
    fetchReceiverInfo();
    
    // Listen for messages
    const chatRef = firestore().collection('USERS').doc(userId).collection('CHATS').doc(receiverId);
  
    const unsubscribe = chatRef.onSnapshot((doc) => {
      if (doc.exists) {
        const { messagesSent = [], messagesReceived = [] } = doc.data();
  
        const combinedMessages = [
          ...messagesSent.map((message) => ({ 
            ...message, 
            senderId: userId,
            createdAt: message.createdAt ? message.createdAt : new Date()
          })),
          ...messagesReceived.map((message) => ({ 
            ...message, 
            senderId: receiverId,
            createdAt: message.createdAt ? message.createdAt : new Date()
          })),
        ].sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
          const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();
          return dateA - dateB;
        });
  
        setMessages(combinedMessages);
        setLoading(false);
      } else {
        console.log("No chat history found.");
        setLoading(false);
      }
    }, error => {
      console.error('Error fetching messages:', error);
      setLoading(false);
    });
  
    return unsubscribe;
  }, [receiverId, userId]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);
  
  // Handle keyboard appearance
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        if (flatListRef.current) {
          setTimeout(() => {
            flatListRef.current.scrollToEnd({ animated: true });
          }, 100);
        }
      }
    );
    
    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const toggleAttachmentOptions = () => {
    setShowAttachmentOptions(!showAttachmentOptions);
    Animated.timing(attachmentHeight, {
      toValue: showAttachmentOptions ? 0 : 120,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const sendMessage = async () => {
    if (newMessage.trim() !== '') {
      try {
        const currentTimestamp = new Date();
  
        // Update sender's document
        const senderChatRef = firestore().collection('USERS').doc(userId).collection('CHATS').doc(receiverId);
        await senderChatRef.set({
          messagesSent: firestore.FieldValue.arrayUnion({
            text: newMessage,
            createdAt: currentTimestamp,
            read: false,
          }),
        }, { merge: true });
  
        // Update receiver's document
        const receiverChatRef = firestore().collection('USERS').doc(receiverId).collection('CHATS').doc(userId);
        await receiverChatRef.set({
          messagesReceived: firestore.FieldValue.arrayUnion({
            text: newMessage,
            createdAt: currentTimestamp,
            read: false,
          }),
        }, { merge: true });
  
        console.log("Message sent:", newMessage);
        setNewMessage('');
        
        // Simulate typing indicator from receiver
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
          }, 3000);
        }, 1000);
      } catch (error) {
        console.error("Error sending message: ", error);
      }
    }
  };
  
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString();
    }
  };
  
  const shouldShowDate = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    
    const currentDate = currentMessage.createdAt instanceof Date 
      ? currentMessage.createdAt 
      : currentMessage.createdAt.toDate();
      
    const previousDate = previousMessage.createdAt instanceof Date 
      ? previousMessage.createdAt 
      : previousMessage.createdAt.toDate();
    
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  const renderMessage = ({ item, index }) => {
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showDate = shouldShowDate(item, previousMessage);
    const isSender = item.senderId === userId;
    const showAvatar = !isSender && (!previousMessage || previousMessage.senderId !== item.senderId);
    
    return (
      <>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
        
        <View style={[
          styles.messageContainer,
          isSender ? styles.sentMessage : styles.receivedMessage
        ]}>
          {!isSender && showAvatar && (
            <Image 
              source={{ uri: receiverInfo?.imageUri }} 
              style={styles.messageAvatar} 
            />
          )}
          
          <View style={[
            styles.messageBubble,
            isSender ? styles.sentBubble : styles.receivedBubble
          ]}>
            <Text style={[
              styles.messageText,
              isSender ? styles.sentMessageText : styles.receivedMessageText
            ]}>
              {item.text}
            </Text>
            <Text style={[
              styles.messageTime,
              isSender ? styles.sentMessageTime : styles.receivedMessageTime
            ]}>
              {formatTime(item.createdAt)}
              {isSender && (
                <MaterialIcons 
                  name={item.read ? "done-all" : "done"} 
                  size={14} 
                  color={item.read ? "#4FC3F7" : "#8E8E8E"} 
                  style={styles.readIcon} 
                />
              )}
            </Text>
          </View>
        </View>
      </>
    );
  };
  
  const renderAttachmentOptions = () => (
    <Animated.View style={[styles.attachmentContainer, { height: attachmentHeight }]}>
      <View style={styles.attachmentOptions}>
        <TouchableOpacity style={styles.attachmentOption}>
          <View style={[styles.attachmentIconContainer, { backgroundColor: '#4CAF50' }]}>
            <Icon name="image" size={22} color="#FFF" />
          </View>
          <Text style={styles.attachmentText}>Hình ảnh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.attachmentOption}>
          <View style={[styles.attachmentIconContainer, { backgroundColor: '#FF9800' }]}>
            <Icon name="camera-alt" size={22} color="#FFF" />
          </View>
          <Text style={styles.attachmentText}>Camera</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.attachmentOption}>
          <View style={[styles.attachmentIconContainer, { backgroundColor: '#F44336' }]}>
            <Icon name="mic" size={22} color="#FFF" />
          </View>
          <Text style={styles.attachmentText}>Âm thanh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.attachmentOption}>
          <View style={[styles.attachmentIconContainer, { backgroundColor: '#9C27B0' }]}>
            <Icon name="location-on" size={22} color="#FFF" />
          </View>
          <Text style={styles.attachmentText}>Vị trí</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerProfile}
          onPress={() => navigation.navigate('InfoCustomer', { userId: receiverId })}
          activeOpacity={0.8}
        >
          <Image 
            source={{ uri: receiverInfo?.imageUri }} 
            style={styles.headerAvatar} 
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{receiverName}</Text>
            <Text style={styles.headerStatus}>
              {isTyping ? 'Đang nhập...' : isOnline ? 'Đang hoạt động' : 'Không hoạt động'}
            </Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerAction}>
            <MaterialIcons name="call" size={22} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <MaterialIcons name="videocam" size={22} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <MaterialIcons name="more-vert" size={22} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />
      
      {/* Attachment Options */}
      {renderAttachmentOptions()}
      
      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.attachButton}
          onPress={toggleAttachmentOptions}
          activeOpacity={0.7}
        >
          <MaterialIcons 
            name={showAttachmentOptions ? "close" : "attach-file"} 
            size={24} 
            color="#777" 
          />
        </TouchableOpacity>
        
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.messageInput}
            placeholder="Nhập tin nhắn..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity style={styles.emojiButton}>
            <MaterialIcons name="emoji-emotions" size={24} color="#777" />
          </TouchableOpacity>
        </View>
        
        {newMessage.trim() ? (
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={sendMessage}
            activeOpacity={0.7}
          >
            <MaterialIcons name="send" size={22} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.micButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="mic" size={24} color="#777" />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    height: 70,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    zIndex: 2,
  },
  backButton: {
    padding: 4,
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  headerInfo: {
    marginLeft: 12,
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  headerStatus: {
    fontSize: 12,
    color: '#4CAF50',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    padding: 8,
    marginLeft: 4,
  },
  messageList: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#777',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    maxWidth: '80%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    marginLeft: 'auto',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    marginRight: 'auto',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 6,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '100%',
  },
  sentBubble: {
    backgroundColor: '#FF6B00',
    borderTopRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  sentMessageText: {
    color: '#FFFFFF',
  },
  receivedMessageText: {
    color: '#333333',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sentMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  receivedMessageTime: {
    color: '#999',
  },
  readIcon: {
    marginLeft: 4,
  },
  attachmentContainer: {
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  attachmentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  attachmentOption: {
    alignItems: 'center',
    width: 70,
  },
  attachmentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  attachmentText: {
    fontSize: 12,
    color: '#555',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  attachButton: {
    padding: 8,
    marginRight: 4,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  emojiButton: {
    padding: 8,
  },
  sendButton: {
    backgroundColor: '#FF6B00',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    padding: 8,
  },
});

export default ChatScreen;