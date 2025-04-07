import { Alert, View, StyleSheet, ImageBackground } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { useState } from "react";
import auth from "@react-native-firebase/auth";

const ChangePassword = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [hiddenCurrentPassword, setHiddenCurrentPassword] = useState(true);
    const [hiddenNewPassword, setHiddenNewPassword] = useState(true);
    const [hiddenConfirmPassword, setHiddenConfirmPassword] = useState(true);

    const hasErrorEmail = () => !email.includes("@");
    const hasErrorCurrentPassword = () => currentPassword.length < 6;
    const hasErrorNewPassword = () => newPassword.length < 6;
    const hasErrorConfirmPassword = () => confirmPassword !== newPassword;

    const handleChangePassword = async () => {
        if (hasErrorEmail() || hasErrorCurrentPassword() || hasErrorNewPassword() || hasErrorConfirmPassword()) {
            Alert.alert("Lỗi", "Vui lòng kiểm tra lại thông tin đã nhập.");
            return;
        }

        try {
            const userCredential = await auth().signInWithEmailAndPassword(email, currentPassword);
            const user = userCredential.user;

            await user.updatePassword(newPassword);
            Alert.alert("Thành công", "Mật khẩu đã được đổi thành công!");
            navigation.navigate("Login");
        } catch (error) {
            Alert.alert("Thất bại", error.message);
        }
    };

    return (
        <ImageBackground 
            source={require('../asset/4.png')} 
            style={styles.background}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Đổi Mật Khẩu</Text>
                    <TextInput
                        label={"Email"}
                        value={email}
                        onChangeText={setEmail}
                        style={styles.input}
                    />
                    <HelperText type="error" visible={hasErrorEmail()}>
                        Địa chỉ email không hợp lệ
                    </HelperText>
                    <TextInput
                        label={"Mật khẩu hiện tại"}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        secureTextEntry={hiddenCurrentPassword}
                        right={<TextInput.Icon icon={"eye"} onPress={() => setHiddenCurrentPassword(!hiddenCurrentPassword)} />}
                        style={styles.input}
                    />
                    <HelperText type="error" visible={hasErrorCurrentPassword()}>
                        Mật khẩu hiện tại phải có ít nhất 6 ký tự
                    </HelperText>
                    <TextInput
                        label={"Mật khẩu mới"}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={hiddenNewPassword}
                        right={<TextInput.Icon icon={"eye"} onPress={() => setHiddenNewPassword(!hiddenNewPassword)} />}
                        style={styles.input}
                    />
                    <HelperText type="error" visible={hasErrorNewPassword()}>
                        Mật khẩu mới phải có ít nhất 6 ký tự
                    </HelperText>
                    <TextInput
                        label={"Xác nhận mật khẩu mới"}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={hiddenConfirmPassword}
                        right={<TextInput.Icon icon={"eye"} onPress={() => setHiddenConfirmPassword(!hiddenConfirmPassword)} />}
                        style={styles.input}
                    />
                    <HelperText type="error" visible={hasErrorConfirmPassword()}>
                        Mật khẩu không khớp
                    </HelperText>
                    <Button mode="contained" style={styles.button} onPress={handleChangePassword}>
                        Đổi Mật Khẩu
                    </Button>
                    <View style={styles.footer}>
                        <Text>Quay lại trang </Text>
                        <Button onPress={() => navigation.navigate("Login")} >Đăng Nhập</Button>
                    </View>
                </View>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.2)', // Màu tối để tăng khả năng đọc
        justifyContent: 'center',
    },
    container: {
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Nền màu trắng trong suốt
        borderRadius: 15,
        margin: 20,
        elevation: 5, // Đổ bóng nhẹ cho chiều sâu
    },
    title: {
        fontSize: 36,
        fontWeight: "bold",
        alignSelf: "center",
        color: "#ff9932", // Màu cam
        marginBottom: 30,
    },
    input: {
        marginBottom: 15,
        backgroundColor: '#fff', // Nền trắng cho các trường nhập
        borderRadius: 10,
    },
    button: {
        marginTop: 20,
        backgroundColor: "#ff9932", // Màu cam
        borderRadius: 10,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 15,
    },
});

export default ChangePassword;