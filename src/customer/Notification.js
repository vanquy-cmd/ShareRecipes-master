import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';

const Notification = ({ adminNotifications = [], friendNotifications = [] }) => {

    const [visible, setVisible] = useState(false);
    const [activeTab, setActiveTab] = useState('admin');
    const shownRef = useRef(false);

    useEffect(() => {
        const hasAdmin = Array.isArray(adminNotifications) && adminNotifications.length > 0;
        const hasFriend = Array.isArray(friendNotifications) && friendNotifications.length > 0;
    
        if (hasAdmin || hasFriend) {
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [adminNotifications, friendNotifications]);
    

    const toggleTab = (tab) => {
        setActiveTab(tab);
    };

    const notifications = activeTab === 'admin' ? adminNotifications : friendNotifications;

    if (!visible || notifications.length === 0) return null;

    return (
        <View style={styles.notificationContainer}>
            <Text style={styles.title}>Thông báo</Text>
            <View style={styles.tabContainer}>
                <TouchableOpacity onPress={() => toggleTab('admin')} style={styles.tabButton(activeTab === 'admin')}>
                    <Text style={styles.tabText}>Từ Admin</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleTab('friends')} style={styles.tabButton(activeTab === 'friends')}>
                    <Text style={styles.tabText}>Từ Bạn Bè</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={notifications}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => <Text style={styles.item}>{item}</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    notificationContainer: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#f8d7da',
        padding: 15,
        borderRadius: 8,
        elevation: 5,
        maxWidth: '90%',
        zIndex: 999,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#721c24',
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    tabButton: (isActive) => ({
        flex: 1,
        padding: 10,
        backgroundColor: isActive ? '#e2a4a4' : '#f5c6cb',
        borderRadius: 5,
        marginHorizontal: 5,
        alignItems: 'center',
    }),
    tabText: {
        color: '#721c24',
        fontWeight: '600',
    },
    item: {
        fontSize: 14,
        color: '#721c24',
        marginBottom: 5,
    },
});

export default Notification;
