import { Text, View } from "react-native"
import { Button } from "react-native-paper"
import { logout, useMyContextController } from "../store"
import { useEffect } from "react"

const Setting = ({ navigation }) => {
    const [controller, dispatch] = useMyContextController()
    const { userLogin } = controller

    const handleLogout = () => {
        logout(dispatch) // Gọi hàm đăng xuất
        navigation.navigate("Login") // Điều hướng về màn hình đăng nhập
    }

    useEffect(() => {
        if (!userLogin) {
            navigation.navigate("Login") // Nếu không có userLogin, điều hướng về màn hình đăng nhập
        }
    }, [userLogin, navigation]);

    return (
        <View style={{ flex: 1, justifyContent: "center" }}>
            <Button mode="contained" onPress={handleLogout}>
                Logout
            </Button>
        </View>
    )
}

export default Setting