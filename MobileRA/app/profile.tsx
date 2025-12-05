import { Text, View, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert, ActivityIndicator } from "react-native";
import { useContext, useState, useEffect } from "react";
import { ThemeContext } from "../ThemeContext";
import { getProfile, updateProfile, UserProfileResponse } from "../api";

export default function Profile() {
  const { isDark, setIsDark } = useContext(ThemeContext);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<{
    monthly_savings: number;
    monthly_salary: number | null;
    current_savings: number;
    blacklist: string[];
    cooling_ranges: Record<string, number>;
    notify_frequency: "daily" | "weekly" | "monthly";
    notify_channel: "app" | "email" | "tg";
  }>({
    monthly_savings: 0,
    monthly_salary: null,
    current_savings: 0,
    blacklist: [],
    cooling_ranges: {},
    notify_frequency: "weekly",
    notify_channel: "app",
  });
  const theme = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      setFormData({
        monthly_savings: data.monthly_savings,
        monthly_salary: data.monthly_salary,
        current_savings: data.current_savings,
        blacklist: data.blacklist,
        cooling_ranges: data.cooling_ranges,
        notify_frequency: (data.notify_frequency as "daily" | "weekly" | "monthly") || "weekly",
        notify_channel: (data.notify_channel as "app" | "email" | "tg") || "app",
      });
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось загрузить профиль");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(formData as any);
      Alert.alert("Успех", "Профиль сохранён");
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось сохранить профиль");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.buttonBg} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.headerText }]}>Профиль</Text>
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

      <ScrollView style={styles.content}>
        <View style={[styles.section, { backgroundColor: theme.sectionBg, borderColor: theme.borderColor }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>О тебе</Text>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Имя</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]}
              placeholder="Как тебя зовут"
              placeholderTextColor={theme.placeholder}
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Возраст</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]}
              placeholder="Например, 22"
              placeholderTextColor={theme.placeholder}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.sectionBg, borderColor: theme.borderColor }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Финансы</Text>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Доход в месяц, ₽</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]}
              placeholder="-"
              placeholderTextColor={theme.placeholder}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Бюджет на котельон, ₽/мес</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]}
              placeholder="-"
              placeholderTextColor={theme.placeholder}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.checkboxField}>
            <Text style={[styles.checkboxText, { color: theme.text }]}>✓ Учитывать накопления при расчёте комфортной даты покупки</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.sectionBg, borderColor: theme.borderColor }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Период охлаждения</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>Для каждого делаемого сумма узнай, сколько дней подождать перед покупкой.</Text>
          <View style={styles.rangeField}>
            <View style={styles.rangeItem}>
              <Text style={[styles.rangeLabel, { color: theme.textSecondary }]}>От, ₽</Text>
              <TextInput
                style={[styles.rangeInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]}
                placeholder="0"
                placeholderTextColor={theme.placeholder}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.rangeItem}>
              <Text style={[styles.rangeLabel, { color: theme.textSecondary }]}>До, ₽</Text>
              <TextInput
                style={[styles.rangeInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]}
                placeholder="5000"
                placeholderTextColor={theme.placeholder}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.rangeItem}>
              <Text style={[styles.rangeLabel, { color: theme.textSecondary }]}>Дней скидания</Text>
              <TextInput
                style={[styles.rangeInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]}
                placeholder="1"
                placeholderTextColor={theme.placeholder}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.rangeField}>
            <View style={styles.rangeItem}>
              <TextInput
                style={[styles.rangeInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]}
                placeholder="3000"
                placeholderTextColor={theme.placeholder}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.rangeItem}>
              <TextInput
                style={[styles.rangeInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]}
                placeholder="20000"
                placeholderTextColor={theme.placeholder}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.rangeItem}>
              <TextInput
                style={[styles.rangeInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]}
                placeholder="3"
                placeholderTextColor={theme.placeholder}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.rangeField}>
            <View style={styles.rangeItem}>
              <TextInput
                style={[styles.rangeInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]}
                placeholder="20000"
                placeholderTextColor={theme.placeholder}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.rangeItem}>
              <TextInput
                style={[styles.rangeInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]}
                placeholder="-"
                placeholderTextColor={theme.placeholder}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.rangeItem}>
              <TextInput
                style={[styles.rangeInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]}
                placeholder="7"
                placeholderTextColor={theme.placeholder}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.sectionBg, borderColor: theme.borderColor }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Чёрный список категорий</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>То, что точно не хочешь покупать. Напримеры: «Кассы в ртах», «Красивые парфюмы»</Text>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.addButtonBg }]}>
            <Text style={[styles.addButtonText, { color: theme.addButtonText }]}>Добавить</Text>
          </TouchableOpacity>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Пока ничего нет</Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.sectionBg, borderColor: theme.borderColor }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Уведомления</Text>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Как часто ассистент будет напоминать про твои вопросы</Text>
            <Text style={[styles.value, { color: theme.text }]}>Не напоминать</Text>
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Частота</Text>
            <Text style={[styles.value, { color: theme.text }]}>Раз в неделю</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.buttonBg, opacity: saving ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={theme.buttonText} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>Сохранить профиль</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const lightTheme = {
  background: '#f5f5f5',
  headerBg: '#ffdd2d',
  headerText: '#000',
  sectionBg: '#fff',
  text: '#000',
  textSecondary: '#666',
  borderColor: '#ddd',
  inputBg: '#f9f9f9',
  placeholder: '#999',
  buttonBg: '#ffdd2d',
  buttonText: '#000',
  addButtonBg: '#ffdd2d',
  addButtonText: '#000',
};

const darkTheme = {
  background: '#1a1a1a',
  headerBg: '#2d2d2d',
  headerText: '#ffdd2d',
  sectionBg: '#2d2d2d',
  text: '#fff',
  textSecondary: '#aaa',
  borderColor: '#444',
  inputBg: '#1a1a1a',
  placeholder: '#666',
  buttonBg: '#ffdd2d',
  buttonText: '#000',
  addButtonBg: '#ffdd2d',
  addButtonText: '#000',
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
  themeToggle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 120,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  checkboxField: {
    marginBottom: 12,
  },
  checkboxText: {
    fontSize: 14,
    fontWeight: '500',
  },
  rangeField: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  rangeItem: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '500',
  },
  rangeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  addButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
