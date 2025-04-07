import React from 'react';
import { View, StyleSheet  } from 'react-native';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import { createStackNavigator } from '@react-navigation/stack';

import RecipeWarehouse from '../customer/RecipeWarehouse';
import Searchs from "../customer/searchs";
import AddRecipe from "../customer/AddRecipe";
import RecipeDetail from "../customer/RecipeDetail";
import EditRecipe from "../customer/EditRecipe";
import InfoCustomer from "../customer/InfoCustomer";
import EditInfoCustomer from "../customer/EditInfoCustomer";
import SearchInHome from "../customer/SearchInHome";
import Screening from "../customer/Screening";
import shareCustomer from "../customer/shareCustomer";
import Comment from "../customer/Comment";
import Messenger from "../customer/Messenger";
import addToCollection from "../customer/addToCollection";
import RecentDishesScreen from "../customer/RecentDishesScreen";
import Stings from "../customer/Stings";
import Login from "../screens/Login";
import ForgotPassword from "../screens/ForgotPassword";
import messageDetail from "../customer/messageDetail";
import notification from "../customer/Notification";

const Tab = createMaterialBottomTabNavigator();
const Stack = createStackNavigator();

const SearchStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tìm Kiếm" component={Searchs} options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="Notification" 
        component={notification} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="AddRecipe" 
        component={AddRecipe} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="RecipeDetail" 
        component={RecipeDetail} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      
      <Stack.Screen 
        name="EditRecipe" 
        component={EditRecipe} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="InfoCustomer" 
        component={InfoCustomer} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="EditInfoCustomer" 
        component={EditInfoCustomer} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="SearchInHome" 
        component={SearchInHome} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="Screening" 
        component={Screening} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="shareCustomer" 
        component={shareCustomer} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="Comment" 
        component={Comment} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="addToCollection" 
        component={addToCollection} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="RecentDishesScreen" 
        component={RecentDishesScreen} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="Stings" 
        component={Stings} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="Login" 
        component={Login} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPassword} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
    </Stack.Navigator>
  );
};

const WarehouseStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Kho món ngon của bạn" component={RecipeWarehouse} options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="AddRecipe" 
        component={AddRecipe} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="RecipeDetail" 
        component={RecipeDetail} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      
      <Stack.Screen 
        name="EditRecipe" 
        component={EditRecipe} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="InfoCustomer" 
        component={InfoCustomer} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="EditInfoCustomer" 
        component={EditInfoCustomer} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="Comment" 
        component={Comment} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="addToCollection" 
        component={addToCollection} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="Stings" 
        component={Stings} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="Login" 
        component={Login} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPassword} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
    </Stack.Navigator>
  );
};

const MessengerStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Đoạn chat" component={Messenger} options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="RecipeDetail" 
        component={RecipeDetail} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="EditRecipe" 
        component={EditRecipe} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="InfoCustomer" 
        component={InfoCustomer} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="EditInfoCustomer" 
        component={EditInfoCustomer} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="shareCustomer" 
        component={shareCustomer} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="addToCollection" 
        component={addToCollection} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="RecentDishesScreen" 
        component={RecentDishesScreen} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="Stings" 
        component={Stings} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="Login" 
        component={Login} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPassword} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
      <Stack.Screen 
        name="messageDetail" 
        component={messageDetail} 
        options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
    </Stack.Navigator>
  );
};

const CustomTabBarButton = ({ children, onPress }) => {
  return (
    <Animatable.View
      animation="bounce" // Hiệu ứng bounce cho tab
      duration={150} // Thời gian hiệu ứng
      style={styles.customButton}
    >
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
      >
        {children}
      </TouchableOpacity>
    </Animatable.View>
  );
};

const Customer = () => {
  return (
      <Tab.Navigator
        activeColor="white"
        barStyle={styles.barStyle}
      >
        <Tab.Screen
          name="Trang chủ"
          component={SearchStack}
          options={{
            tabBarLabel: 'Trang chủ',
            tabBarIcon: ({ color }) => (
              <Icon name="home" color={color} size={26} />
            ),
            tabBarButton: (props) => <CustomTabBarButton {...props} />, // Thêm nút tùy chỉnh
          }}
        />

        <Tab.Screen
          name="Kho món ngon của bạn"
          component={WarehouseStack}
          options={{
            tabBarLabel: 'Kho món ngon',
            tabBarIcon:({ color }) => (
              <Icon name="book" color={color} size={26} />
            ),
            TabBarButton: (props) => <CustomTabBarButton {...props} />, // Thêm hiệu ứng cho tab
          }}
        />

        <Tab.Screen
          name="Khomónngon"
          component={MessengerStack}
          options={{
            tabBarLabel: 'Chats',
            tabBarIcon:({ color }) => (
              <Icon name="message" color={color} size={26} />
            ),
            TabBarButton: (props) => <CustomTabBarButton {...props} />, // Thêm hiệu ứng cho tab
          }}
        />
      </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  barStyle: {
    backgroundColor: '#4CAF50', // Màu cam cho thanh tab
    borderRadius: 20, // Bo tròn góc trái
    overflow: 'hidden', // Đảm bảo không có chỉ số lồi ra ngoài
    elevation: 20, // Tạo bóng cho thanh tab
  },
  customButton: {
    top: -20, // Nâng nút lên để nằm ở giữa
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff', // Nền trắng cho nút chính
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8, // Đổ bóng cho nút
  },
});

export default Customer;
