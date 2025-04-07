import React, { useState, useRef, useEffect } from 'react';
import { 
  Alert, 
  View, 
  StyleSheet, 
  ImageBackground, 
  TouchableOpacity, 
  Animated, 
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { Button, HelperText, Text, TextInput, Divider } from "react-native-paper";
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const { width, height } = Dimensions.get('window');

const Register = ({ navigation }) => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [hiddenPassword, setHiddenPassword] = useState(true);
    const [hiddenPasswordConfirm, setHiddenPasswordConfirm] = useState(true);
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [describe, setDescribe] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    
    const USERS = firestore().collection("USERS");
    
    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const progressAnim = useRef(new Animated.Value(0.33)).current;
    
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
    
    useEffect(() => {
        // Animate progress bar when step changes
        Animated.timing(progressAnim, {
            toValue: currentStep === 1 ? 0.33 : currentStep === 2 ? 0.66 : 1,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [currentStep]);

    const hasErrorFullName = () => fullName.length > 0 && fullName.length < 3;
    const hasErrorEmail = () => email.length > 0 && !email.includes("@");
    const hasErrorPassword = () => password.length > 0 && password.length < 6;
    const hasErrorPasswordConfirm = () => passwordConfirm.length > 0 && passwordConfirm !== password;
    const hasErrorPhone = () => phone.length > 0 && !/^[0-9]{10}$/.test(phone);

    const checkEmailExists = async (email) => {
        const snapshot = await USERS.where('email', '==', email).get();
        return !snapshot.empty;
    };
    
    const goToNextStep = () => {
        if (currentStep === 1) {
            if (!fullName) {
                Alert.alert("Thiếu thông tin", "Vui lòng nhập họ và tên.");
                return;
            }
            if (hasErrorFullName()) {
                Alert.alert("Lỗi", "Họ và tên phải có ít nhất 3 ký tự.");
                return;
            }
            if (!email) {
                Alert.alert("Thiếu thông tin", "Vui lòng nhập email.");
                return;
            }
            if (hasErrorEmail()) {
                Alert.alert("Lỗi", "Email không hợp lệ.");
                return;
            }
            setCurrentStep(2);
        } else if (currentStep === 2) {
            if (!password) {
                Alert.alert("Thiếu thông tin", "Vui lòng nhập mật khẩu.");
                return;
            }
            if (hasErrorPassword()) {
                Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự.");
                return;
            }
            if (!passwordConfirm) {
                Alert.alert("Thiếu thông tin", "Vui lòng xác nhận mật khẩu.");
                return;
            }
            if (hasErrorPasswordConfirm()) {
                Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
                return;
            }
            setCurrentStep(3);
        }
    };
    
    const goToPreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleCreateAccount = async () => {
        // Kiểm tra thông tin đầu vào
        if (hasErrorFullName() || hasErrorEmail() || hasErrorPassword() || hasErrorPasswordConfirm() || hasErrorPhone()) {
            Alert.alert("Lỗi", "Vui lòng kiểm tra lại thông tin đã nhập.");
            return;
        }
        
        if (!fullName || !email || !password || !passwordConfirm) {
            Alert.alert("Thiếu thông tin", "Vui lòng điền đầy đủ các thông tin bắt buộc.");
            return;
        }

        setIsLoading(true);

        try {
            // Kiểm tra xem email đã tồn tại chưa
            const emailExists = await checkEmailExists(email);
            if (emailExists) {
                Alert.alert("Lỗi", "Email đã tồn tại.");
                setIsLoading(false);
                return;
            }

            // Tạo tài khoản Firebase Auth
            await auth().createUserWithEmailAndPassword(email, password);
            
            // Tạo ID mới dựa trên timestamp
            const newId = `@cook_${Date.now()}`;
            
            // Lưu thông tin người dùng vào Firestore
            await USERS.doc(newId).set({
                id: newId,
                fullName,
                email,
                phone: phone || "",
                address: address || "",
                role: "customer",
                imageUri: "file:///data/user/0/com.tranquy11537.ShareRecipes/cache/rn_image_picker_lib_temp_a6b4f1c4-3e81-45c9-98fc-3a248cd5ee82.jpg",
                describe: describe || "",
                createdAt: firestore.FieldValue.serverTimestamp(),
            });
            
            setIsLoading(false);
            Alert.alert(
                "Đăng ký thành công", 
                "Tài khoản của bạn đã được tạo thành công!",
                [{ text: "Đăng nhập ngay", onPress: () => navigation.navigate("Login") }]
            );
        } catch (e) {
            setIsLoading(false);
            Alert.alert("Lỗi", "Tài khoản đã tồn tại hoặc có lỗi khác xảy ra");
            console.error("Error creating account: ", e);
        }
    };

    const renderStepIndicator = () => (
        <View style={styles.stepIndicatorContainer}>
            <View style={styles.stepIndicator}>
                <View style={[styles.stepDot, currentStep >= 1 && styles.activeStepDot]}>
                    <Text style={[styles.stepNumber, currentStep >= 1 && styles.activeStepNumber]}>1</Text>
                </View>
                <View style={styles.stepLine}>
                    <Animated.View 
                        style={[
                            styles.stepLineProgress, 
                            { width: progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%']
                            }) }
                        ]} 
                    />
                </View>
                <View style={[styles.stepDot, currentStep >= 2 && styles.activeStepDot]}>
                    <Text style={[styles.stepNumber, currentStep >= 2 && styles.activeStepNumber]}>2</Text>
                </View>
                <View style={styles.stepLine}>
                    <Animated.View 
                        style={[
                            styles.stepLineProgress, 
                            { width: progressAnim.interpolate({
                                inputRange: [0, 0.33, 0.66, 1],
                                outputRange: ['0%', '0%', '50%', '100%']
                            }) }
                        ]} 
                    />
                </View>
                <View style={[styles.stepDot, currentStep >= 3 && styles.activeStepDot]}>
                    <Text style={[styles.stepNumber, currentStep >= 3 && styles.activeStepNumber]}>3</Text>
                </View>
            </View>
            <View style={styles.stepLabelsContainer}>
                <Text style={[styles.stepLabel, currentStep === 1 && styles.activeStepLabel]}>
                    Thông tin cơ bản
                </Text>
                <Text style={[styles.stepLabel, currentStep === 2 && styles.activeStepLabel]}>
                    Mật khẩu
                </Text>
                <Text style={[styles.stepLabel, currentStep === 3 && styles.activeStepLabel]}>
                    Thông tin thêm
                </Text>
            </View>
        </View>
    );

    const renderStep1 = () => (
        <Animated.View 
            style={[
                styles.stepContainer,
                { 
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <View style={styles.inputContainer}>
                <Icon name="person" size={20} color="#FF6B00" style={styles.inputIcon} />
                <TextInput
                    label="Họ và Tên"
                    value={fullName}
                    onChangeText={setFullName}
                    style={styles.input}
                    mode="flat"
                    theme={{ colors: { primary: '#FF6B00' } }}
                    underlineColor="transparent"
                    activeUnderlineColor="#FF6B00"
                />
            </View>
            <HelperText 
                type="error" 
                visible={hasErrorFullName()}
                style={styles.errorText}
            >
                Họ và tên phải có ít nhất 3 ký tự
            </HelperText>
            
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
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>
            <HelperText 
                type="error" 
                visible={hasErrorEmail()}
                style={styles.errorText}
            >
                Địa chỉ email không hợp lệ
            </HelperText>
            
            <View style={styles.buttonContainer}>
                <Button 
                    mode="contained" 
                    style={styles.nextButton}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                    onPress={goToNextStep}
                >
                    Tiếp tục
                </Button>
            </View>
        </Animated.View>
    );
    
    const renderStep2 = () => (
        <Animated.View 
            style={[
                styles.stepContainer,
                { 
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
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
                />
            </View>
            <HelperText 
                type="error" 
                visible={hasErrorPassword()}
                style={styles.errorText}
            >
                Mật khẩu phải có ít nhất 6 ký tự
            </HelperText>
            
            <View style={styles.inputContainer}>
                <Icon name="lock" size={20} color="#FF6B00" style={styles.inputIcon} />
                <TextInput
                    label="Xác nhận mật khẩu"
                    value={passwordConfirm}
                    onChangeText={setPasswordConfirm}
                    secureTextEntry={hiddenPasswordConfirm}
                    right={
                        <TextInput.Icon 
                            icon={hiddenPasswordConfirm ? "eye" : "eye-off"} 
                            onPress={() => setHiddenPasswordConfirm(!hiddenPasswordConfirm)}
                            color="#777"
                        />
                    }
                    style={styles.input}
                    mode="flat"
                    theme={{ colors: { primary: '#FF6B00' } }}
                    underlineColor="transparent"
                    activeUnderlineColor="#FF6B00"
                />
            </View>
            <HelperText 
                type="error" 
                visible={hasErrorPasswordConfirm()}
                style={styles.errorText}
            >
                Xác nhận mật khẩu phải khớp với mật khẩu
            </HelperText>
            
            <View style={styles.buttonRow}>
                <Button 
                    mode="outlined" 
                    style={styles.backButton}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.backButtonLabel}
                    onPress={goToPreviousStep}
                >
                    Quay lại
                </Button>
                <Button 
                    mode="contained" 
                    style={styles.nextButton}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                    onPress={goToNextStep}
                >
                    Tiếp tục
                </Button>
            </View>
        </Animated.View>
    );
    
    const renderStep3 = () => (
        <Animated.View 
            style={[
                styles.stepContainer,
                { 
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <View style={styles.inputContainer}>
                <Icon name="phone" size={20} color="#FF6B00" style={styles.inputIcon} />
                <TextInput
                    label="Số điện thoại"
                    value={phone}
                    onChangeText={setPhone}
                    style={styles.input}
                    mode="flat"
                    theme={{ colors: { primary: '#FF6B00' } }}
                    underlineColor="transparent"
                    activeUnderlineColor="#FF6B00"
                    keyboardType="phone-pad"
                />
            </View>
            <HelperText 
                type="error" 
                visible={hasErrorPhone()}
                style={styles.errorText}
            >
                Số điện thoại phải có 10 chữ số
            </HelperText>
            
            <View style={styles.inputContainer}>
                <Icon name="location-on" size={20} color="#FF6B00" style={styles.inputIcon} />
                <TextInput
                    label="Địa chỉ"
                    value={address}
                    onChangeText={setAddress}
                    style={styles.input}
                    mode="flat"
                    theme={{ colors: { primary: '#FF6B00' } }}
                    underlineColor="transparent"
                    activeUnderlineColor="#FF6B00"
                />
            </View>
            
            <View style={styles.inputContainer}>
                <Icon name="description" size={20} color="#FF6B00" style={styles.inputIcon} />
                <TextInput
                    label="Mô tả bản thân"
                    value={describe}
                    onChangeText={setDescribe}
                    style={[styles.input, styles.multilineInput]}
                    mode="flat"
                    theme={{ colors: { primary: '#FF6B00' } }}
                    underlineColor="transparent"
                    activeUnderlineColor="#FF6B00"
                    multiline
                    numberOfLines={3}
                />
            </View>
            
            <View style={styles.buttonRow}>
                <Button 
                    mode="outlined" 
                    style={styles.backButton}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.backButtonLabel}
                    onPress={goToPreviousStep}
                    disabled={isLoading}
                >
                    Quay lại
                </Button>
                <Button 
                    mode="contained" 
                    style={styles.registerButton}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                    onPress={handleCreateAccount}
                    loading={isLoading}
                    disabled={isLoading}
                >
                    {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
                </Button>
            </View>
        </Animated.View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : null}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            
            <ImageBackground 
                source={require('../asset/ngD.png')} 
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
                        <TouchableOpacity 
                            style={styles.backButtonTop}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                        >
                            <Icon name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        
                        <Animated.View 
                            style={[
                                styles.headerContainer, 
                                { 
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }]
                                }
                            ]}
                        >
                            <Text style={styles.title}>Đăng Ký Tài Khoản</Text>
                            <Text style={styles.subtitle}>Tạo tài khoản để chia sẻ và khám phá công thức món ngon</Text>
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
                            {renderStepIndicator()}
                            
                            {currentStep === 1 && renderStep1()}
                            {currentStep === 2 && renderStep2()}
                            {currentStep === 3 && renderStep3()}
                            
                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Bạn đã có tài khoản?</Text>
                                <TouchableOpacity 
                                    onPress={() => navigation.navigate("Login")}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.loginLink}>Đăng nhập ngay</Text>
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
    backButtonTop: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.8,
        textAlign: 'center',
        marginHorizontal: 20,
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
    stepIndicatorContainer: {
        marginBottom: 24,
    },
    stepIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    stepDot: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    activeStepDot: {
        backgroundColor: '#FF6B00',
        borderColor: '#FF6B00',
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#777',
    },
    activeStepNumber: {
        color: '#FFFFFF',
    },
    stepLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#F0F0F0',
        position: 'relative',
    },
    stepLineProgress: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: 2,
        backgroundColor: '#FF6B00',
    },
    stepLabelsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingHorizontal: 0,
    },
    stepLabel: {
        fontSize: 12,
        color: '#777',
        textAlign: 'center',
        width: '33%',
    },
    activeStepLabel: {
        color: '#FF6B00',
        fontWeight: 'bold',
    },
    stepContainer: {
        marginBottom: 16,
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
    multilineInput: {
        minHeight: 100,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    errorText: {
        marginBottom: 8,
        fontSize: 12,
    },
    buttonContainer: {
        marginTop: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    nextButton: {
        flex: 1,
        backgroundColor: '#FF6B00',
        borderRadius: 30,
    },
    backButton: {
        flex: 1,
        borderColor: '#FF6B00',
        borderRadius: 30,
        marginRight: 10,
    },
    registerButton: {
        flex: 1,
        backgroundColor: '#FF6B00',
        borderRadius: 30,
    },
    buttonContent: {
        height: 50,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    backButtonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        color: '#FF6B00',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        flexWrap: 'wrap',
    },
    footerText: {
        color: '#555',
        fontSize: 14,
        marginRight: 5,
    },
    loginLink: {
        color: '#FF6B00',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default Register;