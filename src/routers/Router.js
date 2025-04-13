import { createStackNavigator } from "@react-navigation/stack"
import Login from "../screens/Login"
import Register from "../screens/Register"
import Admin from "../screens/Admin"
import Customers from "../customer/Customers"
import ForgotPassword from "../screens/ForgotPassword"
import DetectObjectScreen from "../screens/DetectObjectScreen"
import RecipeChatScreen from "../screens/RecipeChatScreen"
import { LogBox } from "react-native"
import RecipeStorageScreen from "../customer/RecipeWarehouse"
import SocialConnections from "../customer/SocialConnections"
import UserRecipes from "../customer/UserRecipes"
const Stack = createStackNavigator()

const Router = () => {
    LogBox.ignoreLogs(['@firebase/auth: Auth']);
    LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
    LogBox.ignoreAllLogs();//Ignore all log notifications
    return (
        <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
                headerShown: false
            }}
        >
            <Stack.Screen name="Login" component={Login}/>
            <Stack.Screen name="Admin" component={Admin}/>
            <Stack.Screen name="Customers" component={Customers}/>
            <Stack.Screen name="Register" component={Register}/>
            <Stack.Screen name="ForgotPassword" component={ForgotPassword}/>
            <Stack.Screen name="DetectObject" component={DetectObjectScreen}/>
            <Stack.Screen name="RecipeChatScreen" component={RecipeChatScreen} />
            <Stack.Screen name="RecipeStorageScreen" component={RecipeStorageScreen} />
            <Stack.Screen name="SocialConnections" component={SocialConnections} />
            <Stack.Screen name="UserRecipes" component={UserRecipes} />



        </Stack.Navigator>
    )
}

export default Router