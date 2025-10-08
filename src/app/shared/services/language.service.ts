import { Injectable, signal, computed } from '@angular/core';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export interface Translations {
  [key: string]: string | Translations;
}

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly STORAGE_KEY = 'memeup_language';

  // Available languages
  public readonly languages: Language[] = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
    },
    {
      code: 'uk',
      name: 'Ukrainian',
      nativeName: 'Українська',
      flag: '🇺🇦',
    },
    {
      code: 'de',
      name: 'German',
      nativeName: 'Deutsch',
      flag: '🇩🇪',
    },
  ];

  // Current language signal
  private currentLanguageSignal = signal<string>(this.getInitialLanguage());

  // Current language computed
  public currentLanguage = computed(() => {
    const code = this.currentLanguageSignal();
    return this.languages.find((lang) => lang.code === code) || this.languages[0];
  });

  // Translation data
  private translations: { [langCode: string]: Translations } = {};

  constructor() {
    this.loadTranslations();
  }

  /**
   * Get initial language from localStorage or browser preference
   */
  private getInitialLanguage(): string {
    // Check localStorage first
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored && this.languages.some((lang) => lang.code === stored)) {
      return stored;
    }

    // Fallback to browser language
    const browserLang = navigator.language.split('-')[0];
    const supportedLang = this.languages.find((lang) => lang.code === browserLang);
    return supportedLang ? supportedLang.code : 'en';
  }

  /**
   * Change current language
   */
  public setLanguage(langCode: string): void {
    if (this.languages.some((lang) => lang.code === langCode)) {
      this.currentLanguageSignal.set(langCode);
      localStorage.setItem(this.STORAGE_KEY, langCode);
    }
  }

  /**
   * Get translation for a key
   */
  public translate(key: string, params?: { [key: string]: string | number }): string {
    const langCode = this.currentLanguageSignal();
    const translation = this.getNestedTranslation(this.translations[langCode], key);

    if (!translation) {
      console.warn(`Translation missing for key: ${key} in language: ${langCode}`);
      return key; // Return key as fallback
    }

    // Replace parameters if provided
    if (params) {
      return this.replaceParams(translation, params);
    }

    return translation;
  }

  /**
   * Get nested translation value
   */
  private getNestedTranslation(obj: any, key: string): string | null {
    const keys = key.split('.');
    let current = obj;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return null;
      }
    }

    return typeof current === 'string' ? current : null;
  }

  /**
   * Replace parameters in translation string
   */
  private replaceParams(text: string, params: { [key: string]: string | number }): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key]?.toString() || match;
    });
  }

  /**
   * Load all translation files
   */
  private loadTranslations(): void {
    // English translations
    this.translations['en'] = {
      welcome: {
        title: 'MemeUp',
        subtitle:
          'Learn German the fun way! Master vocabulary through hilarious memes, discover German culture and humor, and connect with fellow Deutsch learners.',
        motto: '"Learning with fun!" - Making German language learning enjoyable and memorable.',
        features: {
          memes: {
            title: 'German Memes',
            description:
              'Learn German vocabulary through hilarious memes that capture the unique humor and culture of Germany.',
          },
          culture: {
            title: 'German Culture',
            description:
              'Discover German traditions, festivals, and cultural nuances through interactive exercises and stories.',
          },
          community: {
            title: 'German Community',
            description:
              'Connect with fellow German learners, share your favorite German jokes, and celebrate your language progress together!',
          },
        },
        actions: {
          login: 'Log In',
          signup: 'Sign Up',
          description:
            'New to MemeUp? Join our community and start your German learning journey today!',
        },
        forms: {
          login: {
            title: 'Welcome Back!',
            subtitle: 'Sign in to continue your German learning journey',
            email: 'Email',
            password: 'Password',
            submit: 'Sign In',
            submitting: 'Signing in...',
            cancel: 'Cancel',
            emailPlaceholder: 'Enter your email',
            passwordPlaceholder: 'Enter your password',
            errors: {
              emailRequired: 'Email is required',
              emailInvalid: 'Please enter a valid email',
              passwordRequired: 'Password is required',
              invalidCredentials: 'Invalid email or password. Please try again.',
            },
          },
          signup: {
            title: 'Join MemeUp!',
            subtitle: 'Create your account and start learning German',
            email: 'Email',
            password: 'Password',
            confirmPassword: 'Confirm Password',
            submit: 'Create Account',
            submitting: 'Creating account...',
            cancel: 'Cancel',
            emailPlaceholder: 'Enter your email',
            passwordPlaceholder: 'Create a password',
            confirmPasswordPlaceholder: 'Confirm your password',
            errors: {
              emailRequired: 'Email is required',
              emailInvalid: 'Please enter a valid email',
              passwordRequired: 'Password is required',
              passwordMinLength: 'Password must be at least 6 characters',
              confirmPasswordRequired: 'Please confirm your password',
              passwordsMismatch: 'Passwords do not match.',
              signupComingSoon:
                'Signup feature coming soon! Please contact an administrator to create your account.',
            },
          },
        },
      },
    };

    // Ukrainian translations
    this.translations['uk'] = {
      welcome: {
        title: 'MemeUp',
        subtitle:
          '🇩🇪 Вивчайте німецьку мову весело! Опануйте словник через кумедні меми, дізнайтеся про німецьку культуру та гумор, і спілкуйтеся з іншими вивчачами німецької.',
        motto: '"Навчання з веселощами!" - Робимо вивчення німецької мови приємним та незабутнім.',
        features: {
          memes: {
            title: 'Німецькі Меми',
            description:
              'Вивчайте німецький словник через кумедні меми, які передають унікальний гумор та культуру Німеччини.',
          },
          culture: {
            title: 'Німецька Культура',
            description:
              'Дізнайтеся про німецькі традиції, фестивалі та культурні нюанси через інтерактивні вправи та історії.',
          },
          community: {
            title: 'Німецька Спільнота',
            description:
              'Спілкуйтеся з іншими вивчачами німецької, діліться улюбленими німецькими жартами та святкуйте прогрес у мові разом!',
          },
        },
        actions: {
          login: 'Увійти',
          signup: 'Зареєструватися',
          description:
            'Новий у MemeUp? Приєднуйтесь до нашої спільноти та почніть свою подорож вивчення німецької сьогодні!',
        },
        forms: {
          login: {
            title: 'Ласкаво просимо назад!',
            subtitle: 'Увійдіть, щоб продовжити свою подорож вивчення німецької',
            email: 'Електронна пошта',
            password: 'Пароль',
            submit: 'Увійти',
            submitting: 'Вхід...',
            cancel: 'Скасувати',
            emailPlaceholder: 'Введіть вашу електронну пошту',
            passwordPlaceholder: 'Введіть ваш пароль',
            errors: {
              emailRequired: "Електронна пошта обов'язкова",
              emailInvalid: 'Будь ласка, введіть дійсну електронну пошту',
              passwordRequired: "Пароль обов'язковий",
              invalidCredentials: 'Неправильна електронна пошта або пароль. Спробуйте ще раз.',
            },
          },
          signup: {
            title: 'Приєднуйтесь до MemeUp!',
            subtitle: 'Створіть свій акаунт та почніть вивчати німецьку',
            email: 'Електронна пошта',
            password: 'Пароль',
            confirmPassword: 'Підтвердіть пароль',
            submit: 'Створити акаунт',
            submitting: 'Створення акаунту...',
            cancel: 'Скасувати',
            emailPlaceholder: 'Введіть вашу електронну пошту',
            passwordPlaceholder: 'Створіть пароль',
            confirmPasswordPlaceholder: 'Підтвердіть ваш пароль',
            errors: {
              emailRequired: "Електронна пошта обов'язкова",
              emailInvalid: 'Будь ласка, введіть дійсну електронну пошту',
              passwordRequired: "Пароль обов'язковий",
              passwordMinLength: 'Пароль повинен містити принаймні 6 символів',
              confirmPasswordRequired: 'Будь ласка, підтвердіть свій пароль',
              passwordsMismatch: 'Паролі не співпадають.',
              signupComingSoon:
                "Функція реєстрації скоро з'явиться! Будь ласка, зв'яжіться з адміністратором для створення акаунту.",
            },
          },
        },
      },
    };

    // German translations
    this.translations['de'] = {
      welcome: {
        title: 'MemeUp',
        subtitle:
          '🇩🇪 Lerne Deutsch auf die lustige Art! Meistere Vokabeln durch lustige Memes, entdecke deutsche Kultur und Humor, und verbinde dich mit anderen Deutschlernern.',
        motto: '"Lernen mit Spaß!" - Deutsch lernen macht Spaß und ist unvergesslich.',
        features: {
          memes: {
            title: 'Deutsche Memes',
            description:
              'Lerne deutschen Wortschatz durch lustige Memes, die den einzigartigen Humor und die Kultur Deutschlands einfangen.',
          },
          culture: {
            title: 'Deutsche Kultur',
            description:
              'Entdecke deutsche Traditionen, Feste und kulturelle Nuancen durch interaktive Übungen und Geschichten.',
          },
          community: {
            title: 'Deutsche Gemeinschaft',
            description:
              'Verbinde dich mit anderen Deutschlernern, teile deine Lieblingswitze und feiere gemeinsam deine Sprachfortschritte!',
          },
        },
        actions: {
          login: 'Anmelden',
          signup: 'Registrieren',
          description:
            'Neu bei MemeUp? Tritt unserer Gemeinschaft bei und starte heute deine Deutsch-Lernreise!',
        },
        forms: {
          login: {
            title: 'Willkommen zurück!',
            subtitle: 'Melde dich an, um deine Deutsch-Lernreise fortzusetzen',
            email: 'E-Mail',
            password: 'Passwort',
            submit: 'Anmelden',
            submitting: 'Anmeldung läuft...',
            cancel: 'Abbrechen',
            emailPlaceholder: 'Geben Sie Ihre E-Mail ein',
            passwordPlaceholder: 'Geben Sie Ihr Passwort ein',
            errors: {
              emailRequired: 'E-Mail ist erforderlich',
              emailInvalid: 'Bitte gib eine gültige E-Mail ein',
              passwordRequired: 'Passwort ist erforderlich',
              invalidCredentials: 'Ungültige E-Mail oder Passwort. Bitte versuche es erneut.',
            },
          },
          signup: {
            title: 'Tritt MemeUp bei!',
            subtitle: 'Erstelle dein Konto und starte das Deutschlernen',
            email: 'E-Mail',
            password: 'Passwort',
            confirmPassword: 'Passwort bestätigen',
            submit: 'Konto erstellen',
            submitting: 'Konto wird erstellt...',
            cancel: 'Abbrechen',
            emailPlaceholder: 'Geben Sie Ihre E-Mail ein',
            passwordPlaceholder: 'Erstellen Sie ein Passwort',
            confirmPasswordPlaceholder: 'Bestätigen Sie Ihr Passwort',
            errors: {
              emailRequired: 'E-Mail ist erforderlich',
              emailInvalid: 'Bitte gib eine gültige E-Mail ein',
              passwordRequired: 'Passwort ist erforderlich',
              passwordMinLength: 'Passwort muss mindestens 6 Zeichen haben',
              confirmPasswordRequired: 'Bitte bestätige dein Passwort',
              passwordsMismatch: 'Passwörter stimmen nicht überein.',
              signupComingSoon:
                'Registrierung kommt bald! Bitte kontaktiere einen Administrator, um dein Konto zu erstellen.',
            },
          },
        },
      },
    };
  }
}
