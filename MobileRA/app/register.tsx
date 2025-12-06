import { Text, View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useState, useContext } from "react";
import { useRouter } from "expo-router";
import { ThemeContext } from "../ThemeContext";
import { register } from "../api";

export default function Register() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { isDark } = useContext(ThemeContext);
  const router = useRouter();

  const theme = isDark ? darkTheme : lightTheme;

  const handleRegister = async () => {
    console.log("[Register] Form submission", { nickname, email });
    if (!nickname || !email || !password) {
      console.log("[Register] Validation failed: missing fields");
      Alert.alert("Ошибка", "Заполните все поля");
      return;
    }

    setLoading(true);
    try {
      console.log("[Register] Calling API...");
      await register({ nickname, email, password });
      console.log("[Register] Success, navigating to tabs");
      router.replace("/(tabs)");
    } catch (error) {
      console.log("[Register] Error:", error);
      Alert.alert("Ошибка", "Не удалось создать аккаунт");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.form}>
        <Text style={[styles.title, { color: theme.text }]}>Регистрация</Text>
        
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]}
          placeholder="Ник"
          placeholderTextColor={theme.placeholder}
          value={nickname}
          onChangeText={setNickname}
          editable={!loading}
        />
        
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]}
          placeholder="Email"
          placeholderTextColor={theme.placeholder}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          editable={!loading}
        />
        
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]}
          placeholder="Пароль"
          placeholderTextColor={theme.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.buttonBg, opacity: loading ? 0.6 : 1 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.buttonText} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>Зарегистрироваться</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => router.push("/login")} disabled={loading}>
          <Text style={[styles.link, { color: theme.link }]}>Уже есть аккаунт? Войдите</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const lightTheme = {
  background: '#f5f5f5',
  text: '#000',
  inputBg: '#fff',
  borderColor: '#ddd',
  placeholder: '#999',
  buttonBg: '#ffdd2d',
  buttonText: '#000',
  link: '#ffdd2d',
};

const darkTheme = {
  background: '#1a1a1a',
  text: '#fff',
  inputBg: '#2d2d2d',
  borderColor: '#444',
  placeholder: '#888',
  buttonBg: '#ffdd2d',
  buttonText: '#000',
  link: '#ffdd2d',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    width: '80%',
    maxWidth: 400,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 16,
    textDecorationLine: 'underline',
  },
});
