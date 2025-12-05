import { Text, View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch } from "react-native";
import { useState, useContext } from "react";
import { ThemeContext } from "../ThemeContext";

export default function Index() {
  const [message, setMessage] = useState("");
  const { isDark, setIsDark } = useContext(ThemeContext);
  const [messages, setMessages] = useState([
    { id: 1, text: "Привет! Я рациональный ассистент Т-Банка. Помогу с финансовыми вопросами.", isBot: true }
  ]);

  const sendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, { id: Date.now(), text: message, isBot: false }]);
      setMessage("");
      
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          text: "Анализирую ваш запрос... Рекомендую рассмотреть депозит на 12 месяцев под 18% годовых.", 
          isBot: true 
        }]);
      }, 1000);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.headerText }]}>Рациональный Ассистент</Text>
            <Text style={[styles.headerSubtitle, { color: theme.headerText }]}>Т-Банк</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.themeToggle}>
              <Switch
                value={isDark}
                onValueChange={setIsDark}
                trackColor={{ false: '#ddd', true: '#ffdd2d' }}
                thumbColor={isDark ? '#000' : '#fff'}
              />
            </View>
          </View>
        </View>
      </View>
      
      <ScrollView style={styles.chatContainer}>
        {messages.map((msg) => (
          <View key={msg.id} style={[styles.message, msg.isBot ? 
            { backgroundColor: theme.botMessageBg, alignSelf: 'flex-start', borderBottomLeftRadius: 4 } : 
            { backgroundColor: theme.userMessageBg, alignSelf: 'flex-end', borderBottomRightRadius: 4 }
          ]}>
            <Text style={[styles.messageText, { color: theme.messageText }]}>
              {msg.text}
            </Text>
          </View>
        ))}
      </ScrollView>
      
      <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
        <TextInput
          style={[styles.textInput, { 
            borderColor: theme.inputBorder, 
            backgroundColor: theme.inputBg,
            color: theme.inputText
          }]}
          value={message}
          onChangeText={setMessage}
          placeholder="Задайте вопрос о финансах..."
          placeholderTextColor={theme.placeholder}
          multiline
        />
        <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.sendButton }]} onPress={sendMessage}>
          <Text style={[styles.sendButtonText, { color: theme.sendButtonText }]}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const lightTheme = {
  background: '#f5f5f5',
  headerBg: '#ffdd2d',
  headerText: '#000',
  botMessageBg: '#fff',
  userMessageBg: '#ffdd2d',
  messageText: '#000',
  inputBg: '#fff',
  inputBorder: '#ddd',
  inputText: '#000',
  placeholder: '#999',
  sendButton: '#ffdd2d',
  sendButtonText: '#000',
};

const darkTheme = {
  background: '#1a1a1a',
  headerBg: '#2d2d2d',
  headerText: '#ffdd2d',
  botMessageBg: '#2d2d2d',
  userMessageBg: '#ffdd2d',
  messageText: '#fff',
  inputBg: '#2d2d2d',
  inputBorder: '#444',
  inputText: '#fff',
  placeholder: '#888',
  sendButton: '#ffdd2d',
  sendButtonText: '#000',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 50,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeToggle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 120,
  },
  message: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-end',
    paddingBottom: 20,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
