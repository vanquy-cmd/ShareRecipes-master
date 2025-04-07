import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Animated, 
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { IconButton, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CommentSection = ({ navigation, route }) => {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([
    { 
      id: '1', 
      user: 'Trọng Trần', 
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      time: '1 giờ trước', 
      text: 'Món này trông rất ngon! Tôi sẽ thử làm vào cuối tuần này.',
      likes: 5,
      isLiked: false,
      replies: [
        {
          id: '1-1',
          user: 'Minh Nguyễn',
          avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
          time: '45 phút trước',
          text: 'Tôi đã làm món này rồi, rất ngon đấy bạn!',
          likes: 2,
          isLiked: false
        }
      ]
    },
    { 
      id: '2', 
      user: 'Hương Lê', 
      avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
      time: '3 giờ trước', 
      text: 'Cảm ơn bạn đã chia sẻ công thức. Tôi thích cách bạn trình bày các bước rất rõ ràng.',
      likes: 3,
      isLiked: true,
      replies: []
    },
  ]);
  
  const [replyingTo, setReplyingTo] = useState(null);
  const [showReplies, setShowReplies] = useState({});
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);
  const flatListRef = useRef(null);
  
  // Animation values for each comment
  const commentAnims = useRef(comments.map(() => new Animated.Value(0))).current;
  
  useEffect(() => {
    // Animate main fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Animate each comment with staggered delay
    Animated.stagger(100, 
      commentAnims.map(anim => 
        Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      )
    ).start();
    
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const addComment = () => {
    if (comment.trim()) {
      if (replyingTo) {
        // Add reply to existing comment
        const updatedComments = comments.map(item => {
          if (item.id === replyingTo) {
            return {
              ...item,
              replies: [
                ...item.replies,
                {
                  id: `${item.id}-${item.replies.length + 1}`,
                  user: 'Bạn',
                  avatar: 'https://randomuser.me/api/portraits/men/85.jpg',
                  time: 'Vừa xong',
                  text: comment,
                  likes: 0,
                  isLiked: false
                }
              ]
            };
          }
          return item;
        });
        
        setComments(updatedComments);
        setShowReplies({...showReplies, [replyingTo]: true});
      } else {
        // Add new comment
        const newComment = {
          id: (comments.length + 1).toString(),
          user: 'Bạn',
          avatar: 'https://randomuser.me/api/portraits/men/85.jpg',
          time: 'Vừa xong',
          text: comment,
          likes: 0,
          isLiked: false,
          replies: []
        };
        
        setComments([...comments, newComment]);
        
        // Add a new animation value for the new comment
        commentAnims.push(new Animated.Value(0));
        
        // Animate the new comment
        Animated.timing(commentAnims[commentAnims.length - 1], {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        
        // Scroll to the new comment after it's added
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({animated: true});
        }, 100);
      }
      
      setComment('');
      setReplyingTo(null);
    }
  };
  
  const handleReply = (commentId, userName) => {
    setReplyingTo(commentId);
    setComment(`@${userName} `);
    inputRef.current?.focus();
  };
  
  const toggleLike = (commentId, isReply = false, parentId = null) => {
    if (isReply) {
      const updatedComments = comments.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: comment.replies.map(reply => {
              if (reply.id === commentId) {
                return {
                  ...reply,
                  likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
                  isLiked: !reply.isLiked
                };
              }
              return reply;
            })
          };
        }
        return comment;
      });
      
      setComments(updatedComments);
    } else {
      const updatedComments = comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            isLiked: !comment.isLiked
          };
        }
        return comment;
      });
      
      setComments(updatedComments);
    }
  };
  
  const toggleReplies = (commentId) => {
    setShowReplies({
      ...showReplies,
      [commentId]: !showReplies[commentId]
    });
  };
  
  const cancelReply = () => {
    setReplyingTo(null);
    setComment('');
  };

  const handleBackPress = () => {
    navigation.goBack();
  };
  
  const renderReply = ({ item, parentId }) => {
    return (
      <Animated.View 
        style={[styles.replyItem, { opacity: fadeAnim }]}
      >
        <View style={styles.replyHeader}>
          <Image source={{ uri: item.avatar }} style={styles.replyAvatar} />
          <View style={styles.replyHeaderContent}>
            <Text style={styles.replyUserName}>{item.user}</Text>
            <Text style={styles.replyTime}>{item.time}</Text>
          </View>
        </View>
        
        <Text style={styles.replyText}>{item.text}</Text>
        
        <View style={styles.replyActions}>
          <TouchableOpacity 
            style={styles.replyAction}
            onPress={() => toggleLike(item.id, true, parentId)}
            activeOpacity={0.7}
          >
            <Icon 
              name={item.isLiked ? "favorite" : "favorite-border"} 
              size={16} 
              color={item.isLiked ? "#FF6B00" : "#777"} 
            />
            <Text style={[
              styles.replyActionText, 
              item.isLiked && styles.replyActionTextActive
            ]}>
              {item.likes > 0 ? item.likes : 'Thích'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.replyAction}
            onPress={() => handleReply(parentId, item.user)}
            activeOpacity={0.7}
          >
            <Icon name="reply" size={16} color="#777" />
            <Text style={styles.replyActionText}>Trả lời</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderComment = ({ item, index }) => {
    const hasReplies = item.replies && item.replies.length > 0;
    const showReplySection = showReplies[item.id] || false;
    
    return (
      <Animated.View 
        style={[
          styles.commentItem,
          { 
            opacity: commentAnims[index],
            transform: [{ 
              translateY: commentAnims[index].interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })
            }]
          }
        ]}
      >
        <View style={styles.commentHeader}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <View style={styles.commentHeaderContent}>
            <Text style={styles.userName}>{item.user}</Text>
            <Text style={styles.commentTime}>{item.time}</Text>
          </View>
        </View>
        
        <Text style={styles.commentText}>{item.text}</Text>
        
        <View style={styles.commentActions}>
          <TouchableOpacity 
            style={styles.commentAction}
            onPress={() => toggleLike(item.id)}
            activeOpacity={0.7}
          >
            <Icon 
              name={item.isLiked ? "favorite" : "favorite-border"} 
              size={18} 
              color={item.isLiked ? "#FF6B00" : "#777"} 
            />
            <Text style={[
              styles.commentActionText, 
              item.isLiked && styles.commentActionTextActive
            ]}>
              {item.likes > 0 ? item.likes : 'Thích'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.commentAction}
            onPress={() => handleReply(item.id, item.user)}
            activeOpacity={0.7}
          >
            <Icon name="reply" size={18} color="#777" />
            <Text style={styles.commentActionText}>Trả lời</Text>
          </TouchableOpacity>
          
          {hasReplies && (
            <TouchableOpacity 
              style={styles.commentAction}
              onPress={() => toggleReplies(item.id)}
              activeOpacity={0.7}
            >
              <Icon 
                name={showReplySection ? "expand-less" : "expand-more"} 
                size={18} 
                color="#777" 
              />
              <Text style={styles.commentActionText}>
                {showReplySection ? 'Ẩn phản hồi' : `Xem ${item.replies.length} phản hồi`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {hasReplies && showReplySection && (
          <View style={styles.repliesContainer}>
            <View style={styles.replyLine} />
            {item.replies.map(reply => renderReply({ item: reply, parentId: item.id }))}
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Bình Luận</Text>
        
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.sortButton}>
            <Icon name="sort" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Comments List */}
      <FlatList
        ref={flatListRef}
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.commentsList}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Input Area */}
      <View style={styles.inputContainer}>
        {replyingTo && (
          <View style={styles.replyingToContainer}>
            <Text style={styles.replyingToText}>
              Đang trả lời {comments.find(c => c.id === replyingTo)?.user}
            </Text>
            <TouchableOpacity onPress={cancelReply}>
              <Icon name="close" size={16} color="#777" />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.inputRow}>
          <Image 
            source={{ uri: 'https://randomuser.me/api/portraits/men/85.jpg' }} 
            style={styles.inputAvatar} 
          />
          
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Viết bình luận..."
            value={comment}
            onChangeText={setComment}
            multiline
          />
          
          <TouchableOpacity 
            onPress={addComment} 
            style={[
              styles.sendButton,
              !comment.trim() && styles.sendButtonDisabled
            ]}
            disabled={!comment.trim()} 
          >
            <Icon 
              name="send" 
              size={20} 
              color={comment.trim() ? "#FFFFFF" : "#CCCCCC"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButton: {
    padding: 8,
  },
  commentsList: {
    padding: 16,
    paddingBottom: 100,
  },
  commentItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentHeaderContent: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333',
  },
  commentTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  commentText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 4,
  },
  commentActionText: {
    fontSize: 13,
    color: '#777',
    marginLeft: 4,
  },
  commentActionTextActive: {
    color: '#FF6B00',
  },
  repliesContainer: {
    marginTop: 8,
    paddingLeft: 16,
    position: 'relative',
  },
  replyLine: {
    position: 'absolute',
    left: 8,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#E0E0E0',
  },
  replyItem: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  replyHeaderContent: {
    flex: 1,
  },
  replyUserName: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#333',
  },
  replyTime: {
    fontSize: 11,
    color: '#888',
  },
  replyText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 2,
  },
  replyActionText: {
    fontSize: 12,
    color: '#777',
    marginLeft: 4,
  },
  replyActionTextActive: {
    color: '#FF6B00',
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 12,
    color: '#555',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    color: '#333',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#F0F0F0',
  },
});

export default CommentSection;