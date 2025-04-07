import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ImageBackground, 
  TouchableOpacity, 
  Animated, 
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView
} from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { login, useMyContextController } from "../store";
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const Login = ({ navigation }) => {
    const [controller, dispatch] = useMyContextController();
    const { userLogin } = controller;
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [hiddenPassword, setHiddenPassword] = useState(true);
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    
    useEffect(() => {
        // Start animations when component mounts
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const hasErrorEmail = () => email.length > 0 && (!email.includes("@") || emailError !== "");
    const hasErrorPassword = () => password.length > 0 && (password.length < 6 || passwordError !== "");

    const handleLogin = () => {
        setEmailError("");
        setPasswordError("");

        if (!email) {
            setEmailError("Email không được để trống.");
            return;
        } else if (!email.includes("@")) {
            setEmailError("Email không hợp lệ.");
            return;
        }

        if (!password) {
            setPasswordError("Mật khẩu không được để trống.");
            return;
        } else if (password.length < 6) {
            setPasswordError("Mật khẩu phải có ít nhất 6 ký tự.");
            return;
        }

        if (email && password && !hasErrorEmail() && !hasErrorPassword()) {
            setIsLoading(true);
            // Simulate a delay for the loading state
            setTimeout(() => {
                login(dispatch, email, password);
                setIsLoading(false);
            }, 1500);
        }
    };

    useEffect(() => {
        if (userLogin != null) {
            if (userLogin.role === "admin") navigation.navigate("Admin");
            else if (userLogin.role === "customer") navigation.navigate("Customers");
        }
    }, [userLogin]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : null}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            
            <ImageBackground 
                source={require('../asset/4.png')} 
                style={styles.background}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                    style={styles.gradient}
                >
                    <ScrollView 
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View 
                            style={[
                                styles.logoContainer, 
                                { 
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }]
                                }
                            ]}
                        >
                            <Icon name="restaurant" size={60} color="#FFFFFF" />
                            <Text style={styles.appName}>Món Ngon</Text>
                            <Text style={styles.appSlogan}>Khám phá hương vị Việt</Text>
                        </Animated.View>
                        
                        <Animated.View 
                            style={[
                                styles.formContainer,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }]
                                }
                            ]}
                        >
                            <Text style={styles.title}>Đăng Nhập</Text>
                            
                            <View style={styles.inputContainer}>
                                <Icon name="email" size={20} color="#FF6B00" style={styles.inputIcon} />
                                <TextInput
                                    label="Email"
                                    value={email}
                                    onChangeText={setEmail}
                                    style={styles.input}
                                    mode="flat"
                                    theme={{ colors: { primary: '#FF6B00' } }}
                                    underlineColor="transparent"
                                    activeUnderlineColor="#FF6B00"
                                    accessibilityLabel="Email input"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                            
                            <HelperText 
                                type="error" 
                                visible={hasErrorEmail()}
                                style={styles.errorText}
                            >
                                {emailError || (hasErrorEmail() ? "Địa chỉ Email không hợp lệ" : "")}
                            </HelperText>
                            
                            <View style={styles.inputContainer}>
                                <Icon name="lock" size={20} color="#FF6B00" style={styles.inputIcon} />
                                <TextInput
                                    label="Mật khẩu"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={hiddenPassword}
                                    right={
                                        <TextInput.Icon 
                                            icon={hiddenPassword ? "eye" : "eye-off"} 
                                            onPress={() => setHiddenPassword(!hiddenPassword)}
                                            color="#777"
                                        />
                                    }
                                    style={styles.input}
                                    mode="flat"
                                    theme={{ colors: { primary: '#FF6B00' } }}
                                    underlineColor="transparent"
                                    activeUnderlineColor="#FF6B00"
                                    accessibilityLabel="Password input"
                                />
                            </View>
                            
                            <HelperText 
                                type="error" 
                                visible={hasErrorPassword()}
                                style={styles.errorText}
                            >
                                {passwordError || (hasErrorPassword() ? "Mật khẩu ít nhất 6 ký tự" : "")}
                            </HelperText>
                            
                            <TouchableOpacity 
                                style={styles.forgotPasswordLink}
                                onPress={() => navigation.navigate("ForgotPassword")}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                            </TouchableOpacity>
                            
                            <Button 
                                mode="contained" 
                                style={styles.loginButton}
                                contentStyle={styles.loginButtonContent}
                                labelStyle={styles.loginButtonLabel}
                                onPress={handleLogin}
                                loading={isLoading}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                            </Button>
                            
                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>HOẶC</Text>
                                <View style={styles.dividerLine} />
                            </View>
                            
                            <View style={styles.socialButtonsContainer}>
                                <TouchableOpacity style={[styles.socialButton, styles.facebookButton]}>
                                    <Icon name="facebook" size={24} color="#FFFFFF" />
                                </TouchableOpacity>
                                
                                <TouchableOpacity style={[styles.socialButton, styles.googleButton]}>
                                    <Icon name="mail" size={24} color="#FFFFFF" />
                                </TouchableOpacity>
                                
                                <TouchableOpacity style={[styles.socialButton, styles.appleButton]}>
                                    <Icon name="phone-android" size={24} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Bạn chưa có tài khoản?</Text>
                                <TouchableOpacity 
                                    onPress={() => navigation.navigate("Register")}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.registerLink}>Tạo tài khoản mới</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </ScrollView>
                </LinearGradient>
            </ImageBackground>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        paddingTop: 50,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 10,
    },
    appSlogan: {
        fontSize: 16,
        color: '#FFFFFF',
        marginTop: 5,
        opacity: 0.8,
    },
    formContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 24,
        textAlign: 'center',
    },
    inputContainer: {
        position: 'relative',
        marginBottom: 4,
    },
    inputIcon: {
        position: 'absolute',
        top: 28,
        left: 12,
        zIndex: 1,
    },
    input: {
        backgroundColor: '#F5F5F5',
        paddingLeft: 40,
        height: 56,
        fontSize: 16,
        borderRadius: 8,
    },
    errorText: {
        marginBottom: 8,
        fontSize: 12,
    },
    forgotPasswordLink: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    forgotPasswordText: {
        color: '#FF6B00',
        fontSize: 14,
    },
    loginButton: {
        backgroundColor: '#FF6B00',
        borderRadius: 30,
        marginBottom: 20,
        elevation: 2,
    },
    loginButtonContent: {
        height: 50,
    },
    loginButtonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    dividerText: {
        marginHorizontal: 10,
        color: '#777',
        fontSize: 12,
        fontWeight: 'bold',
    },
    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 24,
    },
    socialButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
        elevation: 2,
    },
    facebookButton: {
        backgroundColor: '#3b5998',
    },
    googleButton: {
        backgroundColor: '#DB4437',
    },
    appleButton: {
        backgroundColor: '#333',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    footerText: {
        color: '#555',
        fontSize: 14,
        marginRight: 5,
    },
    registerLink: {
        color: '#FF6B00',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default Login;