import React, { useEffect, useState } from "react";
import { Provider as PaperProvider } from "react-native-paper"; // Thêm import này
import { MyContextControllerProvider } from "../ShareRecipes-master/src/store";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { NavigationContainer } from "@react-navigation/native";
import Router from "../ShareRecipes-master/src/routers/Router";
import DetectObject from "./src";


const App = () => {
  const USERS = firestore().collection("USERS")
  const [adminId, setAdminId] = useState(null); // State để lưu ID admin

  const admin = {
      id: adminId, // Thêm trường id vào admin
      fullName: "Trần Văn Quý",
      email: "tranquy11537@gmail.com",
      password: "123456",
      phone: "0913131732",
      address: "Binh Duong",
      role: "admin",
      imageUri: "file:///data/user/0/com.tranquy11537.ShareRecipes/cache/rn_image_picker_lib_temp_396ff4a4-50bd-43ca-a168-49c3e560b915.jpg", // Thêm trường imageUri
      describe: "Mô tả về admin"
  }

  const getNextAdminId = async () => {
    const snapshot = await USERS.get();
    const ids = snapshot.docs.map(doc => {
      const id = doc.data().id;
      return parseInt(id.replace('@cook_', '')); // Chỉ lấy phần số từ id
    });
    const maxId = Math.max(...ids, -1); // Tìm ID lớn nhất hoặc -1 nếu không có ID nào
    return `@cook_${maxId + 1}`; // Tạo ID mới
  };

  useEffect(() => {
    const createAdminAccount = async () => {
      const newId = await getNextAdminId(); // Lấy ID mới
      setAdminId(newId); // Cập nhật ID admin

      USERS.doc(newId)
      .onSnapshot(u => {
          if (!u.exists) {
              auth().createUserWithEmailAndPassword(admin.email, admin.password)
              .then(response => {
                  USERS.doc(newId).set(admin) // Sử dụng ID mới
                  console.log("Add new account admin");
              });
          }
      });
    };

    createAdminAccount(); // Gọi hàm tạo tài khoản admin
  }, []);

  return (
    <PaperProvider>
      <MyContextControllerProvider>
        <NavigationContainer>
            <Router />
          
        </NavigationContainer>
      </MyContextControllerProvider>
    </PaperProvider>
    
  )
}

export default App