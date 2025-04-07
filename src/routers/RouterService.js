import { createStackNavigator } from "@react-navigation/stack";
import Services from "../screens/Services";
import AccountInfo from "../screens/AccountInfo";
import Transaction from "../screens/Transaction";
import { useMyContextController } from "../store";
import { IconButton } from "react-native-paper";
import { useNavigation } from "@react-navigation/native"; // Thêm import này
import EditInfoCustomer from "../customer/EditInfoCustomer";
import AddRecipe from "../customer/AddRecipe";
import RecipeDetail from "../customer/RecipeDetail";
import EditRecipe from "../customer/EditRecipe";
import ImageViewerScreen from "../screens/ImageViewerScreen";

const Stack = createStackNavigator();

const RouterService = () => {
    const [controller, dispatch] = useMyContextController();
    const { userLogin } = controller;
    const navigation = useNavigation(); // Khởi tạo navigation

    return (
        <Stack.Navigator
            initialRouteName="Services"
            screenOptions={{
                headerTitleAlign: "center",
                headerStyle: {
                    backgroundColor: "pink"
                },
                headerRight: () => (
                    <IconButton
                        icon={"account"}
                        onPress={() => navigation.navigate('AccountInfo', { userInfo: userLogin })} // Điều hướng đến AccountInfo
                    />
                ),
            }}
        >
            <Stack.Screen 
                name="Services" 
                component={Services} 
                options={{ 
                    title: userLogin ? userLogin.fullName : "Dịch vụ",
                    headerLeft: null, // Ẩn nút mũi tên quay lại
                 }} // Thay đổi tiêu đề tại đây
            />
            <Stack.Screen name="AccountInfo" component={AccountInfo} 
                options={{ 
                    title: "Thông tin cá nhân",
                    headerRight: () => (
                        <IconButton
                            icon={"dots-vertical"}
                            onPress={() => navigation.navigate('EditInfoCustomer', { userInfo: userLogin })} // Điều hướng đến AccountInfo
                        />
                    ),
                 }}
            />
            <Stack.Screen name="Transaction" component={Transaction} />
            <Stack.Screen 
                name="EditInfoCustomer" 
                component={EditInfoCustomer} 
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
                name="ImageViewerScreen" 
                component={ImageViewerScreen} 
                options={{ 
                    headerLeft: null, // Ẩn nút mũi tên quay lại
                    headerShown: false, // Ẩn tiêu đề và header
                }}
            />
        </Stack.Navigator>
    );
}

export default RouterService;