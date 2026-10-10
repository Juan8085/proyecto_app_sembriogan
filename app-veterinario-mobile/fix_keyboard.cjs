const fs = require('fs');

let asisContent = fs.readFileSync('src/screens/AsistenteScreen.js', 'utf8');

// Ensure Keyboard is imported
if (!asisContent.includes('Keyboard,')) {
    asisContent = asisContent.replace(/KeyboardAvoidingView, Platform, ActivityIndicator/g, 'KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard');
}

// Add state for Keyboard
if (!asisContent.includes('isKeyboardVisible')) {
    asisContent = asisContent.replace(
        /const \[loading, setLoading\] = useState\(false\);/g,
        `const [loading, setLoading] = useState(false);\n  const [isKeyboardVisible, setKeyboardVisible] = useState(false);\n\n  useEffect(() => {\n    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));\n    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));\n    return () => {\n      keyboardDidHideListener.remove();\n      keyboardDidShowListener.remove();\n    };\n  }, []);`
    );
}

// Ensure useEffect is imported
if (!asisContent.includes('useEffect')) {
    asisContent = asisContent.replace(/import React, \{ useState, useRef \} from 'react';/, "import React, { useState, useRef, useEffect } from 'react';");
}

// Change paddingBottom logic
asisContent = asisContent.replace(
    /paddingBottom: 100, \/\/ Espacio para que flote sobre el TabBar/g,
    `paddingBottom: isKeyboardVisible ? 12 : 90,`
);
// It might be hardcoded as a style, but we need it dynamic. Let's find the style.
// Oh wait, styles are static. We must inline it!
asisContent = asisContent.replace(
    /style=\{styles\.inputContainer\}/g,
    `style={[styles.inputContainer, { paddingBottom: isKeyboardVisible ? (Platform.OS === 'ios' ? 20 : 12) : 100 }]}`
);

// Remove the hardcoded paddingBottom from styles
asisContent = asisContent.replace(/paddingBottom: 100, \/\/ Espacio para que flote sobre el TabBar/g, "");

fs.writeFileSync('src/screens/AsistenteScreen.js', asisContent);
console.log("Keyboard fix applied to AsistenteScreen");
