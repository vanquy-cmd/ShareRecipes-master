import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IconButton } from 'react-native-paper';
import { logout, useMyContextController } from "../store";

const SettingsScreen = () => {
    const [controller, dispatch] = useMyContextController();
    const { userLogin } = controller;
    const navigation = useNavigation();
    const [accountMenuVisible, setAccountMenuVisible] = useState(false);

    const toggleAccountMenu = () => {
      setAccountMenuVisible(!accountMenuVisible);
  };

    const handleLogout = () => {
        navigation.navigate("Login"); // Điều hướng về màn hình đăng nhập
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
                <Text style={styles.title}>Cài đặt</Text>
            </View>

            <TouchableOpacity style={styles.settingOption}>
                <Text style={styles.settingText}>Quốc gia</Text>
                <View style={styles.optionRight}>
                    <Image source={{ uri: 'https://flagcdn.com/w40/vn.png' }} style={styles.flagIcon} />
                    <Text style={styles.flagText}>Việt Nam</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingOption} onPress={toggleAccountMenu}>
                <Text style={styles.settingText}>Tài khoản</Text>
            </TouchableOpacity>

            {accountMenuVisible && (
                <View style={styles.accountMenu}>
                    <TouchableOpacity style={styles.accountMenuOption} onPress={() => navigation.navigate('ForgotPassword')}>
                        <Text style={styles.accountMenuText}>Đổi mật khẩu</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.accountMenuOption}>
                        <Text style={styles.accountMenuText}>Thông tin tài khoản</Text>
                    </TouchableOpacity>
                </View>
            )}

            <TouchableOpacity style={styles.settingOption}>
                <Text style={styles.settingText}>Điều chỉnh chức năng thông báo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingOption}>
                <Text style={styles.settingText}>Điều khoản và Chính sách</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingOption}>
                <Text style={styles.settingText}>Về Cookpad</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingOption}>
                <Text style={styles.settingText}>Chủ đề</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Thoát</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f6f2',
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    settingOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    settingText: {
        fontSize: 16,
    },
    optionRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    flagIcon: {
        width: 24,
        height: 16,
        marginRight: 10,
    },
    flagText: {
        fontSize: 16,
    },
    accountMenuOption: {
      paddingVertical: 10,
      marginLeft: 15
    },
    accountMenuText: {
        fontSize: 16,
        color: '#333',
    },
    logoutButton: {
        marginTop: 20,
        backgroundColor: '#6e6e6e',
        borderRadius: 5,
        paddingVertical: 10,
        alignItems: 'center',
    },
    logoutText: {
        fontSize: 16,
        color: '#fff',
    },
});

export default SettingsScreen;
