const fs = require('fs');

let asisContent = fs.readFileSync('src/screens/AsistenteScreen.js', 'utf8');

// Change behavior of KeyboardAvoidingView
asisContent = asisContent.replace(
  /behavior=\{Platform\.OS === 'ios' \? 'padding' : undefined\}/g,
  "behavior={Platform.OS === 'ios' ? 'padding' : 'height'}"
);

// We should NOT rely on inline paddingBottom because it's buggy on some Androids with absolute tabs.
// Let's remove the inline style entirely and rely on a dummy View at the bottom for padding.
asisContent = asisContent.replace(
  /<View style=\{\[styles\.inputContainer, \{ paddingBottom: isKeyboardVisible \? \(Platform\.OS === 'ios' \? 20 : 12\) : 100 \}\]\}>/g,
  "<View style={styles.inputContainer}>"
);

// We add a dummy view at the very end of KeyboardAvoidingView that takes up the tab bar space ONLY when keyboard is closed
asisContent = asisContent.replace(
  /<\/KeyboardAvoidingView>/g,
  "  {!isKeyboardVisible && <View style={{ height: 80, backgroundColor: '#ffffff' }} />}\n    </KeyboardAvoidingView>"
);


fs.writeFileSync('src/screens/AsistenteScreen.js', asisContent);
console.log('AsistenteScreen robust keyboard fix applied!');
