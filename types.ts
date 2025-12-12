
export enum CalendarType {
  GREGORIAN = 'Gregorian (Masehi)',
  HIJRI = 'Hijri (Islamic)',
  JAVANESE = 'Javanese (Weton)',
  CHINESE = 'Chinese (Imlek)',
  BAZI = 'Bazi',
  JAPANESE = 'Japan',
  KOREAN = 'Korean',
  THAI = 'Thailand',
  IRANIAN = 'Iranian',
  HINDI = 'Hindi',
}

export enum CalendarViewFormat {
  VERTICAL = 'Vertikal',
  HORIZONTAL = 'Horizontal'
}

export enum CalendarPeriod {
  DAILY = 'Harian',
  MONTHLY = 'Bulanan',
  YEARLY = 'Tahunan'
}

export enum CalendarContentMode {
  DUAL = 'Gregorian + Native',
  NATIVE_ONLY = 'Native Only'
}

export interface CustomEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  notes?: string;
  color?: string; // Hex code
  reminderMinutes?: number; // Minutes before event
}

export interface Task {
    id: string;
    date: string; // YYYY-MM-DD
    timeSlot?: string; // "01:00", etc. for Daily
    content: string;
    isCompleted: boolean;
    reminderTime?: string; // ISO String or "HH:mm"
}

export interface CalendarDay {
  day: number;
  month: number;
  year: number;
  isToday: boolean;
  isHoliday: boolean;
  holidayName?: string;
  holidayCountry?: string;
  nativeDateStr: string;
  nativeDay: string; // Native numeral
  nativeMonthName?: string;
  nativeYear?: string;
  nativeDayName?: string;
  weton?: string; // For Javanese
  zodiac?: string; // For Chinese/Bazi
  ganzhi?: string; // For Bazi
  events?: CustomEvent[];
  hasTasks?: boolean;
  hasReminders?: boolean; 
}

export interface AppSettings {
  theme: 'auto' | 'light' | 'dark';
  themeName?: string; // Specific theme: hijri, java, etc.
  zoom: number; // 0.5 to 1.5
  language: string; // Locale code
  isFullscreen: boolean;
  taskHighlightColor: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

export interface CountryOption {
  name: string;
  code: string; // ISO Code
  defaultLang?: string; 
  flag?: string; 
}

export interface MediaItem {
    type: 'image' | 'video';
    url: string;
    id: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'id-ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'ms-MY', name: 'Malay', flag: '🇲🇾' },
  { code: 'th-TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'vi-VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'my-MM', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'km-KH', name: 'Cambodia', flag: '🇰🇭' },
  { code: 'lo-LA', name: 'Laos', flag: '🇱🇦' },
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
  { code: 'fa-IR', name: 'Persian', flag: '🇮🇷' },
  { code: 'tl-PH', name: 'Tagalog', flag: '🇵🇭' },
  { code: 'zh-HK', name: 'Hongkong', flag: '🇭🇰' },
  { code: 'zh-TW', name: 'Taiwanese', flag: '🇹🇼' },
  { code: 'ja-JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
  { code: 'bn-BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'ur-PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'ne-NP', name: 'Nepal', flag: '🇳🇵' },
  { code: 'uz-UZ', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: 'tk-TM', name: 'Turkmenistan', flag: '🇹🇲' },
  { code: 'ky-KG', name: 'Kyrgyzstan', flag: '🇰🇬' },
  { code: 'az-AZ', name: 'Azerbaijan', flag: '🇦🇿' },
  { code: 'mn-MN', name: 'Mongolia', flag: '🇲🇳' },
  { code: 'ar-QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'ar-IQ', name: 'Iraq', flag: '🇮🇶' },
  { code: 'ar-AE', name: 'UEA', flag: '🇦🇪' },
  { code: 'ar-OM', name: 'Oman', flag: '🇴🇲' },
  { code: 'ar-BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'ar-KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'ar-LB', name: 'Lebanon', flag: '🇱🇧' },
  { code: 'si-LK', name: 'Srilanka', flag: '🇱🇰' },
  { code: 'ps-AF', name: 'Afghanistan', flag: '🇦🇫' },
  { code: 'ar-PS', name: 'Palestina', flag: '🇵🇸' },
  { code: 'dz-BT', name: 'Bhutan', flag: '🇧🇹' },
  { code: 'ru-RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'de-DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'fr-FR', name: 'France', flag: '🇫🇷' },
  { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
  { code: 'it-IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'tr-TR', name: 'Turkish', flag: '🇹🇷' },
  { code: 'pt-PT', name: 'Portugis', flag: '🇵🇹' },
  { code: 'sv-SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'he-IL', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'de-CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'ro-RO', name: 'Rumania', flag: '🇷🇴' },
  { code: 'pl-PL', name: 'Polish', flag: '🇵🇱' },
  { code: 'nl-NL', name: 'Dutch', flag: '🇳🇱' },
  { code: 'nl-BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'da-DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'el-GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'sq-AL', name: 'Albania', flag: '🇦🇱' },
  { code: 'af-ZA', name: 'African', flag: '🇿🇦' },
  { code: 'en-NG', name: 'Nigerian', flag: '🇳🇬' },
  { code: 'ar-EG', name: 'Mesir', flag: '🇪🇬' },
  { code: 'ar-DZ', name: 'Aljazair', flag: '🇩🇿' },
  { code: 'ar-YE', name: 'Yaman', flag: '🇾🇪' },
  { code: 'ar-MA', name: 'Maroko', flag: '🇲🇦' },
  { code: 'ar-TN', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'so-SO', name: 'Somalia', flag: '🇸🇴' },
  { code: 'fr-ML', name: 'Mali', flag: '🇲🇱' },
  { code: 'en-CA', name: 'Canada', flag: '🇨🇦' },
];

export const AiOptionsData = {
  ratio: ['16:9', '9:16', '1:1'],
  size: ['1K', '2K', '4K'],
  background: ['none', 'beach', 'forest', 'mountain', 'city', 'building', 'village', 'landmark', 'mosque', 'space', 'galaxy', 'green screen'],
  camera: ['none', 'Panorama', 'Close up', 'zoom in', 'zoom out', 'static shot'],
  style: ['none', 'cinematic', 'realistic', 'ultra-realistic', 'monochrome', 'old style', 'vintage', 'cartoon', 'animasi 3D', 'pixel art', 'anime', 'comic'],
  light: ['none', 'normal', 'bright', 'golden hours', 'darknes'],
  weather: ['none', 'sunny', 'rain', 'windy', 'snow', 'autumn', 'summer', 'thunder'],
  time: ['none', 'morning', 'sunny day', 'afternoon', 'midnight']
};

export const AI_GENERATORS = [
    { name: 'Gemini', url: 'https://gemini.google.com/' },
    { name: 'Meta AI', url: 'https://www.meta.ai/media' },
    { name: 'Grok', url: 'https://grok.com/imagine' },
    { name: 'Leonardo', url: 'https://app.leonardo.ai/image-generation' },
    { name: 'LMArena', url: 'https://lmarena.ai/' }
];

// Full Country List
export const COUNTRIES: CountryOption[] = [
  { "code": "AD", "name": "Andorra" },
  { "code": "AE", "name": "United Arab Emirates" },
  { "code": "AF", "name": "Afghanistan" },
  { "code": "AG", "name": "Antigua and Barbuda" },
  { "code": "AI", "name": "Anguilla" },
  { "code": "AL", "name": "Albania" },
  { "code": "AM", "name": "Armenia" },
  { "code": "AO", "name": "Angola" },
  { "code": "AQ", "name": "Antarctica" },
  { "code": "AR", "name": "Argentina" },
  { "code": "AS", "name": "American Samoa" },
  { "code": "AT", "name": "Austria" },
  { "code": "AU", "name": "Australia" },
  { "code": "AW", "name": "Aruba" },
  { "code": "AX", "name": "Åland Islands" },
  { "code": "AZ", "name": "Azerbaijan" },
  { "code": "BA", "name": "Bosnia and Herzegovina" },
  { "code": "BB", "name": "Barbados" },
  { "code": "BD", "name": "Bangladesh" },
  { "code": "BE", "name": "Belgium" },
  { "code": "BF", "name": "Burkina Faso" },
  { "code": "BG", "name": "Bulgaria" },
  { "code": "BH", "name": "Bahrain" },
  { "code": "BI", "name": "Burundi" },
  { "code": "BJ", "name": "Benin" },
  { "code": "BL", "name": "Saint Barthélemy" },
  { "code": "BM", "name": "Bermuda" },
  { "code": "BN", "name": "Brunei Darussalam" },
  { "code": "BO", "name": "Bolivia" },
  { "code": "BQ", "name": "Bonaire, Sint Eustatius and Saba" },
  { "code": "BR", "name": "Brazil" },
  { "code": "BS", "name": "Bahamas" },
  { "code": "BT", "name": "Bhutan" },
  { "code": "BV", "name": "Bouvet Island" },
  { "code": "BW", "name": "Botswana" },
  { "code": "BY", "name": "Belarus" },
  { "code": "BZ", "name": "Belize" },
  { "code": "CA", "name": "Canada" },
  { "code": "CC", "name": "Cocos (Keeling) Islands" },
  { "code": "CD", "name": "DR Congo" },
  { "code": "CF", "name": "Central African Republic" },
  { "code": "CG", "name": "Congo" },
  { "code": "CH", "name": "Switzerland" },
  { "code": "CI", "name": "Côte d'Ivoire" },
  { "code": "CK", "name": "Cook Islands" },
  { "code": "CL", "name": "Chile" },
  { "code": "CM", "name": "Cameroon" },
  { "code": "CN", "name": "China" },
  { "code": "CO", "name": "Colombia" },
  { "code": "CR", "name": "Costa Rica" },
  { "code": "CU", "name": "Cuba" },
  { "code": "CV", "name": "Cabo Verde" },
  { "code": "CW", "name": "Curaçao" },
  { "code": "CX", "name": "Christmas Island" },
  { "code": "CY", "name": "Cyprus" },
  { "code": "CZ", "name": "Czechia" },
  { "code": "DE", "name": "Germany" },
  { "code": "DJ", "name": "Djibouti" },
  { "code": "DK", "name": "Denmark" },
  { "code": "DM", "name": "Dominica" },
  { "code": "DO", "name": "Dominican Republic" },
  { "code": "DZ", "name": "Algeria" },
  { "code": "EC", "name": "Ecuador" },
  { "code": "EE", "name": "Estonia" },
  { "code": "EG", "name": "Egypt" },
  { "code": "EH", "name": "Western Sahara" },
  { "code": "ER", "name": "Eritrea" },
  { "code": "ES", "name": "Spain" },
  { "code": "ET", "name": "Ethiopia" },
  { "code": "FI", "name": "Finland" },
  { "code": "FJ", "name": "Fiji" },
  { "code": "FK", "name": "Falkland Islands" },
  { "code": "FM", "name": "Micronesia" },
  { "code": "FO", "name": "Faroe Islands" },
  { "code": "FR", "name": "France" },
  { "code": "GA", "name": "Gabon" },
  { "code": "GB", "name": "United Kingdom" },
  { "code": "GD", "name": "Grenada" },
  { "code": "GE", "name": "Georgia" },
  { "code": "GF", "name": "French Guiana" },
  { "code": "GG", "name": "Guernsey" },
  { "code": "GH", "name": "Ghana" },
  { "code": "GI", "name": "Gibraltar" },
  { "code": "GL", "name": "Greenland" },
  { "code": "GM", "name": "Gambia" },
  { "code": "GN", "name": "Guinea" },
  { "code": "GP", "name": "Guadeloupe" },
  { "code": "GQ", "name": "Equatorial Guinea" },
  { "code": "GR", "name": "Greece" },
  { "code": "GS", "name": "South Georgia" },
  { "code": "GT", "name": "Guatemala" },
  { "code": "GU", "name": "Guam" },
  { "code": "GW", "name": "Guinea-Bissau" },
  { "code": "GY", "name": "Guyana" },
  { "code": "HK", "name": "Hong Kong" },
  { "code": "HM", "name": "Heard & McDonald Is." },
  { "code": "HN", "name": "Honduras" },
  { "code": "HR", "name": "Croatia" },
  { "code": "HT", "name": "Haiti" },
  { "code": "HU", "name": "Hungary" },
  { "code": "ID", "name": "Indonesia" },
  { "code": "IE", "name": "Ireland" },
  { "code": "IL", "name": "Israel" },
  { "code": "IM", "name": "Isle of Man" },
  { "code": "IN", "name": "India" },
  { "code": "IO", "name": "British Indian Ocean" },
  { "code": "IQ", "name": "Iraq" },
  { "code": "IR", "name": "Iran" },
  { "code": "IS", "name": "Iceland" },
  { "code": "IT", "name": "Italy" },
  { "code": "JE", "name": "Jersey" },
  { "code": "JM", "name": "Jamaica" },
  { "code": "JO", "name": "Jordan" },
  { "code": "JP", "name": "Japan" },
  { "code": "KE", "name": "Kenya" },
  { "code": "KG", "name": "Kyrgyzstan" },
  { "code": "KH", "name": "Cambodia" },
  { "code": "KI", "name": "Kiribati" },
  { "code": "KM", "name": "Comoros" },
  { "code": "KN", "name": "Saint Kitts and Nevis" },
  { "code": "KP", "name": "North Korea" },
  { "code": "KR", "name": "South Korea" },
  { "code": "KW", "name": "Kuwait" },
  { "code": "KY", "name": "Cayman Islands" },
  { "code": "KZ", "name": "Kazakhstan" },
  { "code": "LA", "name": "Laos" },
  { "code": "LB", "name": "Lebanon" },
  { "code": "LC", "name": "Saint Lucia" },
  { "code": "LI", "name": "Liechtenstein" },
  { "code": "LK", "name": "Sri Lanka" },
  { "code": "LR", "name": "Liberia" },
  { "code": "LS", "name": "Lesotho" },
  { "code": "LT", "name": "Lithuania" },
  { "code": "LU", "name": "Luxembourg" },
  { "code": "LV", "name": "Latvia" },
  { "code": "LY", "name": "Libya" },
  { "code": "MA", "name": "Morocco" },
  { "code": "MC", "name": "Monaco" },
  { "code": "MD", "name": "Moldova" },
  { "code": "ME", "name": "Montenegro" },
  { "code": "MF", "name": "Saint Martin" },
  { "code": "MG", "name": "Madagascar" },
  { "code": "MH", "name": "Marshall Islands" },
  { "code": "MK", "name": "North Macedonia" },
  { "code": "ML", "name": "Mali" },
  { "code": "MM", "name": "Myanmar" },
  { "code": "MN", "name": "Mongolia" },
  { "code": "MO", "name": "Macao" },
  { "code": "MP", "name": "Northern Mariana Is." },
  { "code": "MQ", "name": "Martinique" },
  { "code": "MR", "name": "Mauritania" },
  { "code": "MS", "name": "Montserrat" },
  { "code": "MT", "name": "Malta" },
  { "code": "MU", "name": "Mauritius" },
  { "code": "MV", "name": "Maldives" },
  { "code": "MW", "name": "Malawi" },
  { "code": "MX", "name": "Mexico" },
  { "code": "MY", "name": "Malaysia" },
  { "code": "MZ", "name": "Mozambique" },
  { "code": "NA", "name": "Namibia" },
  { "code": "NC", "name": "New Caledonia" },
  { "code": "NE", "name": "Niger" },
  { "code": "NF", "name": "Norfolk Island" },
  { "code": "NG", "name": "Nigeria" },
  { "code": "NI", "name": "Nicaragua" },
  { "code": "NL", "name": "Netherlands" },
  { "code": "NO", "name": "Norway" },
  { "code": "NP", "name": "Nepal" },
  { "code": "NR", "name": "Nauru" },
  { "code": "NU", "name": "Niue" },
  { "code": "NZ", "name": "New Zealand" },
  { "code": "OM", "name": "Oman" },
  { "code": "PA", "name": "Panama" },
  { "code": "PE", "name": "Peru" },
  { "code": "PF", "name": "French Polynesia" },
  { "code": "PG", "name": "Papua New Guinea" },
  { "code": "PH", "name": "Philippines" },
  { "code": "PK", "name": "Pakistan" },
  { "code": "PL", "name": "Poland" },
  { "code": "PM", "name": "Saint Pierre and Miquelon" },
  { "code": "PN", "name": "Pitcairn" },
  { "code": "PR", "name": "Puerto Rico" },
  { "code": "PS", "name": "Palestine" },
  { "code": "PT", "name": "Portugal" },
  { "code": "PW", "name": "Palau" },
  { "code": "PY", "name": "Paraguay" },
  { "code": "QA", "name": "Qatar" },
  { "code": "RE", "name": "Réunion" },
  { "code": "RO", "name": "Romania" },
  { "code": "RS", "name": "Serbia" },
  { "code": "RU", "name": "Russia" },
  { "code": "RW", "name": "Rwanda" },
  { "code": "SA", "name": "Saudi Arabia" },
  { "code": "SB", "name": "Solomon Islands" },
  { "code": "SC", "name": "Seychelles" },
  { "code": "SD", "name": "Sudan" },
  { "code": "SE", "name": "Sweden" },
  { "code": "SG", "name": "Singapore" },
  { "code": "SH", "name": "Saint Helena" },
  { "code": "SI", "name": "Slovenia" },
  { "code": "SJ", "name": "Svalbard and Jan Mayen" },
  { "code": "SK", "name": "Slovakia" },
  { "code": "SL", "name": "Sierra Leone" },
  { "code": "SM", "name": "San Marino" },
  { "code": "SN", "name": "Senegal" },
  { "code": "SO", "name": "Somalia" },
  { "code": "SR", "name": "Suriname" },
  { "code": "SS", "name": "South Sudan" },
  { "code": "ST", "name": "Sao Tome and Principe" },
  { "code": "SV", "name": "El Salvador" },
  { "code": "SX", "name": "Sint Maarten" },
  { "code": "SY", "name": "Syria" },
  { "code": "SZ", "name": "Eswatini" },
  { "code": "TC", "name": "Turks and Caicos Is." },
  { "code": "TD", "name": "Chad" },
  { "code": "TF", "name": "French Southern Terr." },
  { "code": "TG", "name": "Togo" },
  { "code": "TH", "name": "Thailand" },
  { "code": "TJ", "name": "Tajikistan" },
  { "code": "TK", "name": "Tokelau" },
  { "code": "TL", "name": "Timor-Leste" },
  { "code": "TM", "name": "Turkmenistan" },
  { "code": "TN", "name": "Tunisia" },
  { "code": "TO", "name": "Tonga" },
  { "code": "TR", "name": "Türkiye" },
  { "code": "TT", "name": "Trinidad and Tobago" },
  { "code": "TV", "name": "Tuvalu" },
  { "code": "TW", "name": "Taiwan" },
  { "code": "TZ", "name": "Tanzania" },
  { "code": "UA", "name": "Ukraine" },
  { "code": "UG", "name": "Uganda" },
  { "code": "UM", "name": "US Minor Outlying Is." },
  { "code": "US", "name": "United States" },
  { "code": "UY", "name": "Uruguay" },
  { "code": "UZ", "name": "Uzbekistan" },
  { "code": "VA", "name": "Holy See" },
  { "code": "VC", "name": "St. Vincent & Grenadines" },
  { "code": "VE", "name": "Venezuela" },
  { "code": "VG", "name": "British Virgin Is." },
  { "code": "VI", "name": "U.S. Virgin Is." },
  { "code": "VN", "name": "Vietnam" },
  { "code": "VU", "name": "Vanuatu" },
  { "code": "WF", "name": "Wallis and Futuna" },
  { "code": "WS", "name": "Samoa" },
  { "code": "YE", "name": "Yemen" },
  { "code": "YT", "name": "Mayotte" },
  { "code": "ZA", "name": "South Africa" },
  { "code": "ZM", "name": "Zambia" },
  { "code": "ZW", "name": "Zimbabwe" }
];
