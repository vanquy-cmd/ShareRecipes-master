import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, AsyncStorage } from 'react-native';
import { IconButton } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const SearchInHome = () => {
    const navigation = useNavigation();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchHistory, setSearchHistory] = useState([]);

    useEffect(() => {
        const loadHistory = async () => {
            const history = await AsyncStorage.getItem('searchHistory');
            if (history) {
                setSearchHistory(JSON.parse(history));
            }
        };
        loadHistory();
    }, []);

    const handleSearch = async (text) => {
        setSearchTerm(text);
        if (text) {
            // Fetch recipes matching the ingredient name
            const recipesSnapshot = await firestore()
                .collection('RECIPES')
                .get();

            const recipesData = recipesSnapshot.docs.map(doc => ({ id: doc.id, type: 'recipe', ...doc.data() }));

            // Lọc các công thức chứa nguyên liệu khớp với tìm kiếm
            const filteredResults = recipesData.filter(recipe => 
                recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(text.toLowerCase()))
            );

            setSearchResults(filteredResults); // Cập nhật kết quả tìm kiếm
        } else {
            setSearchResults([]);
        }
    };

    const handleSelectItem = (item) => {
        if (item.type === 'recipe') {
            console.log('Selected recipe:', item);
            navigation.navigate('RecipeDetail', { recipeId: item.id });
        }
    };

    const saveSearchTerm = async (term) => {
        if (!searchHistory.includes(term)) {
            const updatedHistory = [...searchHistory, term];
            setSearchHistory(updatedHistory);
            await AsyncStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
        }
    };

    const handleSubmitEditing = () => {
        if (searchTerm) {
            saveSearchTerm(searchTerm);
            handleSearch(searchTerm);
        }
    };

    const handleBackPress = () => {
        navigation.goBack(); // Quay lại trang trước
    };

    const goToScreening = () => {
        navigation.navigate('Screening');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}> 
                <IconButton 
                    style={styles.iconBack} 
                    icon="arrow-left" 
                    onPress={handleBackPress} 
                />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm nguyên liệu..."
                    value={searchTerm}
                    onChangeText={handleSearch}
                    onSubmitEditing={handleSubmitEditing}
                />
                <IconButton 
                    style={styles.iconShare}
                    icon={() => (
                        <MaterialCommunityIcons name="tune-variant" size={24} color="black" />
                    )}
                    onPress={goToScreening} 
                />
            </View>
            
            <FlatList
                data={searchResults}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleSelectItem(item)}>
                        <Text style={styles.itemText}>{item.name}</Text>
                    </TouchableOpacity>
                )}
                keyExtractor={item => item.id}
                style={styles.resultsList}
            />

            <View style={styles.historyContainer}>
                <Text style={styles.historyTitle}>Lịch sử tìm kiếm</Text>
                {searchHistory.map((term, index) => (
                    <TouchableOpacity key={index} onPress={() => handleSearch(term)}>
                        <Text style={styles.historyItem}>{term}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: 20,
        backgroundColor: '#ffffff',
        padding: 10,
    },
    iconBack: {
        marginLeft: -15,
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 25,
        paddingHorizontal: 10,
        marginHorizontal: 5,
    },
    iconShare: {
        marginLeft: 10,
        marginRight: -10,
    },
    resultsList: {
        marginBottom: 20,
    },
    itemText: {
        padding: 10,
        fontSize: 16,
    },
    historyContainer: {
        marginTop: 20,
    },
    historyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    historyItem: {
        padding: 8,
        fontSize: 16,
        color: 'blue',
    },
});

export default SearchInHome;