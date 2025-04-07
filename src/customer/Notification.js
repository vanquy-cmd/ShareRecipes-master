import React, { useState, useEffect } from 'react';

const Notification = ({ notifications }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (notifications.length > 0) {
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), 5000); // Auto-hide after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [notifications]);

    return (
        <div>
            {visible && notifications.length > 0 && (
                <div style={styles.notificationContainer}>
                    <h4 style={styles.title}>Thông báo</h4>
                    <ul style={styles.list}>
                        {notifications.map((notification, index) => (
                            <li key={index} style={styles.item}>
                                {notification}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const styles = {
    notificationContainer: {
        position: 'fixed',
        top: '10px',
        right: '10px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        padding: '15px',
        borderRadius: '5px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
    },
    title: {
        margin: 0,
        marginBottom: '10px',
        fontSize: '16px',
        fontWeight: 'bold',
    },
    list: {
        margin: 0,
        padding: 0,
        listStyleType: 'none',
    },
    item: {
        fontSize: '14px',
        marginBottom: '5px',
    },
};

export default Notification;