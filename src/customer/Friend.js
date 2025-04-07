const addFriend = async (friendId) => {
    const firestore = getFirestore();
    const friendsRef = doc(firestore, 'FRIENDS', userId);
  
    try {
      const docSnap = await getDoc(friendsRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (!data.friends.includes(friendId)) {
          // Thêm bạn bè vào danh sách
          data.friends.push(friendId);
          await updateDoc(friendsRef, { friends: data.friends });
        }
      } else {
        // Tạo tài liệu mới nếu chưa có
        await setDoc(friendsRef, { userId: userId, friends: [friendId] });
      }
    } catch (error) {
      console.error("Lỗi khi thêm bạn: ", error);
    }
  };
  
  // Tìm kiếm bạn bè
  const searchFriends = async (searchTerm) => {
    const firestore = getFirestore();
    const usersCollection = collection(firestore, 'USERS');
    const q = query(usersCollection, where('name', '==', searchTerm)); 
    
    const querySnapshot = await getDocs(q);
    const foundUsers = querySnapshot.docs.map(doc => doc.data());
  
    setFoundUsers(foundUsers); // Giả sử bạn đã tạo state foundUsers để lưu trữ danh sách tìm kiếm
  };
  
  // Lắng nghe cập nhật bạn bè
  useEffect(() => {
    const friendsRef = doc(getFirestore(), 'FRIENDS', userId);
    const unsubscribe = onSnapshot(friendsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFriends(data.friends || []); // Giả sử bạn đã tạo state friends để lưu trữ danh sách bạn bè
      } 
    });
  
    return () => unsubscribe();
  }, [userId]);