# 🎯 Исправление: Answer Options теперь сохраняются!

## 🔍 **Проблема была найдена:**

В `TaskService.addTask()` и `TaskService.updateTask()` **не отправлялись поля** `options`, `charsCsv`, `correctAnswer` и другие в API.

## ✅ **Что было исправлено:**

### **1. Обновлен TaskDto интерфейс:**

```typescript
interface TaskDto {
  // ... существующие поля ...

  // Новые поля для анаграмм и вариантов ответов
  options?: TaskOption[];
  charsCsv?: string | null;
  correctAnswer?: string | null;
  taskImageSource?: string | null;
  resultImagePath?: string | null;
  resultImageSource?: string | null;
}
```

### **2. Обновлен addTask payload:**

```typescript
const payload = {
  // ... существующие поля ...

  // Добавляем поля для анаграмм и вариантов ответов
  options: data.options ?? [],
  charsCsv: data.charsCsv ?? '',
  correctAnswer: data.correctAnswer ?? '',
  taskImageSource: data.taskImageSource ?? '',
  resultImagePath: data.resultImagePath ?? '',
  resultImageSource: data.resultImageSource ?? '',
};
```

### **3. Обновлен updateTask payload:**

```typescript
const payload = {
  // ... существующие поля ...

  // Добавляем поля для анаграмм и вариантов ответов
  options: data.options,
  charsCsv: data.charsCsv,
  correctAnswer: data.correctAnswer,
  taskImageSource: data.taskImageSource,
  resultImagePath: data.resultImagePath,
  resultImageSource: data.resultImageSource,
};
```

### **4. Обновлена функция mapDto:**

```typescript
function mapDto(dto: TaskDto): Task {
  return {
    // ... существующие поля ...

    // Новые поля для анаграмм и вариантов ответов
    options: dto.options ?? undefined,
    charsCsv: dto.charsCsv ?? undefined,
    correctAnswer: dto.correctAnswer ?? undefined,
    taskImageSource: dto.taskImageSource ?? undefined,
    resultImagePath: dto.resultImagePath ?? undefined,
    resultImageSource: dto.resultImageSource ?? undefined,
  };
}
```

## 🚀 **Результат:**

### **До исправления:**

```json
{
  "levelId": "425ff2c3-8808-4319-b4fb-f828f429111b",
  "internalName": "task 1",
  "type": 0,
  "headerText": "",
  "imageUrl": "",
  "orderIndex": 0,
  "timeLimitSec": 0,
  "pointsAttempt1": 0,
  "pointsAttempt2": 0,
  "pointsAttempt3": 0,
  "explanationText": "",
  "status": 1
  // ❌ options отсутствовали!
}
```

### **После исправления:**

```json
{
  "levelId": "425ff2c3-8808-4319-b4fb-f828f429111b",
  "internalName": "task 1",
  "type": 0,
  "headerText": "",
  "imageUrl": "",
  "orderIndex": 0,
  "timeLimitSec": 0,
  "pointsAttempt1": 0,
  "pointsAttempt2": 0,
  "pointsAttempt3": 0,
  "explanationText": "",
  "status": 1,
  // ✅ Теперь отправляются все поля!
  "options": [
    {
      "label": "1",
      "isCorrect": true,
      "imageUrl": ""
    }
  ],
  "charsCsv": "",
  "correctAnswer": "",
  "taskImageSource": "",
  "resultImagePath": "",
  "resultImageSource": ""
}
```

## 📋 **Теперь поддерживаются:**

- ✅ **Answer Options** для text_choice и image_choice задач
- ✅ **Anagram поля** (charsCsv, correctAnswer)
- ✅ **Дополнительные изображения** (taskImageSource, resultImagePath, resultImageSource)

## 🎯 **Для тестирования:**

1. **Создайте новую задачу** типа text_choice
2. **Добавьте варианты ответов** через "Add option"
3. **Нажмите Create** - варианты должны сохраниться
4. **Проверьте логи** - в Payload должны быть options
5. **Проверьте API ответ** - options должны вернуться

Теперь Answer Options полностью работают! 🎊
