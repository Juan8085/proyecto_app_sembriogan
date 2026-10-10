const fs = require('fs');
const path = require('path');

const dir = 'src/screens';
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (file.endsWith('.js')) {
        let content = fs.readFileSync(path.join(dir, file), 'utf8');
        
        // Remove AsyncStorage import
        content = content.replace(/import AsyncStorage from '@react-native-async-storage\/async-storage';\n?/g, '');
        // Add SecureStore import
        if (!content.includes('expo-secure-store')) {
            content = content.replace(/(import .* from 'react-native';\n)/, "$1import * as SecureStore from 'expo-secure-store';\n");
        }
        
        // Replace AsyncStorage methods
        content = content.replace(/AsyncStorage\.getItem/g, 'SecureStore.getItemAsync');
        content = content.replace(/AsyncStorage\.setItem/g, 'SecureStore.setItemAsync');
        // SecureStore doesn't have clear(), we have to remove items individually
        content = content.replace(/await AsyncStorage\.clear\(\);/g, "await SecureStore.deleteItemAsync('token');\n    await SecureStore.deleteItemAsync('usuario');");

        fs.writeFileSync(path.join(dir, file), content);
    }
});

console.log("Migrated from AsyncStorage to SecureStore successfully");
