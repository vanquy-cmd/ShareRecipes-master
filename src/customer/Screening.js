import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity, FlatList, Alert  } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';

const Screening = () => {
    const navigation = useNavigation();
    const [includeName, setIncludeName] = useState('');
    const [excludeName, setExcludeName] = useState('');
    const [recipes, setRecipes] = useState([]);
    const [totalRecipes, setTotalRecipes] = useState(0); // State để lưu tổng số món ăn
    const [suggestions, setSuggestions] = useState([]); // State để lưu gợi ý
    const [selectedIngredients, setSelectedIngredients] = useState([]); // State lưu nguyên liệu đã chọn
    const [filteredRecipes, setFilteredRecipes] = useState([]); // State để lưu trữ món ăn đã lọc

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('RECIPES')
            .onSnapshot(snapshot => {
                const recipeList = [];
                snapshot.forEach(doc => {
                    recipeList.push({ id: doc.id, ...doc.data() });
                });
                setRecipes(recipeList);
                setTotalRecipes(recipeList.length); // Cập nhật tổng số món ăn
                setFilteredRecipes(recipeList); // Khởi tạo danh sách món ăn đã lọc
            }, error => {
                console.error("Error fetching recipes: ", error);
                Alert.alert('Error', 'Could not fetch recipes. Please try again later.');
            });

        // Cleanup function to unsubscribe from listener
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // Cập nhật danh sách món ăn đã lọc khi nguyên liệu đã chọn thay đổi
        if (selectedIngredients.length > 0) {
            const updatedRecipes = recipes.filter(recipe =>
                selectedIngredients.every(ingredient =>
                    recipe.name.toLowerCase().includes(ingredient.toLowerCase())
                )
            );
            setFilteredRecipes(updatedRecipes);
            setTotalRecipes(updatedRecipes.length);
        } else {
            setFilteredRecipes(recipes);
            setTotalRecipes(recipes.length);
        }
    }, [selectedIngredients, recipes]);

    // Hàm tìm kiếm gợi ý
    const handleSearch = (text) => {
        setIncludeName(text);
        if (text.length > 0) {
            const filteredSuggestions = recipes
                .filter(recipe => recipe.name.toLowerCase().includes(text.toLowerCase()))
                .map(recipe => recipe.name);
            setSuggestions(filteredSuggestions);
        } else {
            setSuggestions([]); // Xóa gợi ý nếu ô tìm kiếm trống
        }
    };

    const selectSuggestion = (suggestion) => {
        if (!selectedIngredients.includes(suggestion)) { // Kiểm tra nguyên liệu đã được chọn chưa
            setSelectedIngredients([...selectedIngredients, suggestion]);
        }
        setIncludeName(''); // Xóa ô nhập liệu
        setSuggestions([]);
    };

    const removeIngredient = (ingredient) => {
        setSelectedIngredients(selectedIngredients.filter(item => item !== ingredient)); // Xóa nguyên liệu khỏi danh sách
    };

    const goToSearchHome = () => {
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}> 
                <IconButton 
                    style={styles.iconBack} 
                    icon="arrow-left" 
                    onPress={goToSearchHome} />
                <Text style={styles.headerText}>Sàng lọc</Text>
            </View>

            <View style={styles.filterContainer}>
                <View>
                    <Text style={styles.label}>Hiển thị các món với:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Gõ vào tên các nguyên liệu..."
                        value={includeName}
                        onChangeText={handleSearch} // Sử dụng hàm tìm kiếm
                    />
                    {suggestions.length > 0 && (
                        <FlatList
                            data={suggestions}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => selectSuggestion(item)}>
                                    <Text style={styles.suggestionItem}>{item}</Text>
                                </TouchableOpacity>
                            )}
                            style={styles.suggestionList}
                        />
                    )}

                    {/* Hiển thị các nguyên liệu đã chọn */}
                    <View style={styles.selectedIngredientsContainer}>
                        {selectedIngredients.map((ingredient, index) => (
                            <TouchableOpacity key={index} style={styles.selectedIngredient}>
                                <Text style={styles.selectedIngredientText}>{ingredient}</Text>
                                <View style={styles.removeButton}>
                                    <Text 
                                        style={styles.removeIngredientText} 
                                        onPress={() => removeIngredient(ingredient)}>×</Text>
                                </View>
                                
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Hiển thị các món không có:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Gõ vào tên các nguyên liệu..."
                        value={excludeName}
                        onChangeText={setExcludeName}
                    />
                </View>

                <View>
                    <TouchableOpacity style={styles.button}>
                        <Text style={styles.buttonText}>Hiển thị {totalRecipes} món</Text>
                    </TouchableOpacity>
                </View>
                
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
        borderRadius: 8,
        padding: 10,
    },
    iconBack: {
        marginLeft: -15,
        marginRight: 10, // Giữ khoảng cách giữa nút và ô tìm kiếm
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    filterContainer: {
        flex: 1,
        justifyContent: 'space-between', // Đẩy nút xuống dưới
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        fontWeight: 'bold',
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 5,
        backgroundColor: '#f5f5f5',
    },
    button: {
        backgroundColor: '#ff9932',
        borderRadius: 5,
        padding: 15,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    suggestionList: {
        position: 'absolute',
        backgroundColor: '#fff',
        zIndex: 10,
        width: '100%',
        maxHeight: 200,
        elevation: 3,
        marginTop: 65, // Thêm khoảng cách giữa input và suggestion
    },
    suggestionItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    selectedIngredientsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
        marginBottom: 10,
    },
    selectedIngredient: {
        backgroundColor: '#e0e0e0',
        padding: 5,
        borderRadius: 15,
        marginRight: 5,
        marginBottom: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedIngredientText: {
        marginRight: 5,
    },
    removeButton: {
        backgroundColor: '#ff9999', // Màu nền cho nút xóa
        borderRadius: 15, // Bo tròn
        width: 24, // Chiều rộng
        height: 24, // Chiều cao
        justifyContent: 'center', // Căn giữa
        alignItems: 'center', // Căn giữa
    },
    removeIngredientText: {
        color: 'red',
        fontWeight: 'bold', // Đậm
        fontSize: 16, // Kích thước chữ
    },
});

export default Screening;