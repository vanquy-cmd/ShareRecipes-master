import React from 'react';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Hoặc một biểu tượng khác mà bạn chọn
import { MaterialIcons } from 'react-native-vector-icons'; // Thêm thư viện icon nếu cần
import RouterService from '../routers/RouterService';
import Transaction from './Transaction';
import Customer from './Customer'
import Setting from './Setting';

const Tab = createMaterialBottomTabNavigator();
const Stack = createStackNavigator();

const CustomerStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Danh Sách Người Dùng" component={Customer} options={{ 
            headerLeft: null, // Ẩn nút mũi tên quay lại
            headerShown: false, // Ẩn tiêu đề và header
          }}
      />
    </Stack.Navigator>
  );
};


const Admin = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="RouterService"
        component={RouterService}
        options={{
          title: 'Home',
          tabBarIcon: 'home',
        }}
      />
      {/* <Tab.Screen
        name="Transaction"
        component={Transaction}
        options={{
          tabBarIcon: 'cash',
        }}
      /> */}
      <Tab.Screen
        name="Customer"
        component={CustomerStack}
        options={{
          tabBarIcon: 'account',
        }}
      />
      <Tab.Screen
        name="Setting"
        component={Setting}
        options={{
          tabBarIcon: 'cog',
        }}
      />
    </Tab.Navigator>
  );
};

export default Admin;