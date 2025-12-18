
import { CalendarType, CalendarDay, CustomEvent, Task } from '../types';

// --- Javanese Logic (Pasaran) ---
const PASARAN = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];
const getWeton = (date: Date): string => {
  // Epoch: 1 Jan 1900 was Senin Legi (Monday Legi)
  const refDate = new Date(1900, 0, 1); 
  const oneDay = 24 * 60 * 60 * 1000;
  const diffTime = date.getTime() - refDate.getTime();
  const diffDays = Math.round(diffTime / oneDay);
  
  let pasaranIndex = diffDays % 5;
  if (pasaranIndex < 0) pasaranIndex += 5;
  
  return PASARAN[pasaranIndex];
};

// --- Chinese/Bazi Logic (Simplified Gan-Zhi) ---
const HEAVENLY_STEMS = ['Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui'];
const EARTHLY_BRANCHES = ['Zi', 'Chou', 'Yin', 'Mao', 'Chen', 'Si', 'Wu', 'Wei', 'Shen', 'You', 'Xu', 'Hai'];
const ANIMALS = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];

const getGanZhi = (year: number) => {
    const offset = year - 4;
    const stem = HEAVENLY_STEMS[offset % 10];
    const branch = EARTHLY_BRANCHES[offset % 12];
    return `${stem}-${branch}`;
};

const getZodiac = (year: number) => {
    const offset = year - 4;
    return ANIMALS[offset % 12];
}

// --- Numeral Converters ---
export const getNativeDateDigit = (num: number, type: CalendarType): string => {
    const str = num.toString();
    if (type === CalendarType.HIJRI || type === CalendarType.IRANIAN) {
        const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return str.replace(/\d/g, d => arabicDigits[parseInt(d)]);
    }
    if (type === CalendarType.JAVANESE) {
         const javaneseDigits = ['꧐', '꧑', '꧒', '꧓', '꧔', '꧕', '꧖', '꧗', '꧘', '꧙'];
         return str.replace(/\d/g, d => javaneseDigits[parseInt(d)]);
    }
    if (type === CalendarType.THAI) {
        const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
        return str.replace(/\d/g, d => thaiDigits[parseInt(d)]);
    }
    if (type === CalendarType.HINDI) {
        const hindiDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
        return str.replace(/\d/g, d => hindiDigits[parseInt(d)]);
    }
    if (type === CalendarType.CHINESE || type === CalendarType.BAZI || type === CalendarType.JAPANESE) {
        const chineseDigits = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
        return str.replace(/\d/g, d => chineseDigits[parseInt(d)]);
    }
    if (type === CalendarType.KOREAN) {
        // Korean Sino-Korean numbers for dates generally use Arabic numerals in modern contexts, 
        // but for traditional feel we can use Hanja or Hangul. 
        // Using Hangul Sino-Korean for distinct look as requested.
        const koreanDigits = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
        // Simple digit replacement. For proper reading (e.g. 12 = sip-i), logic is more complex.
        // Keeping it digit-based for calendar grids.
        return str.replace(/\d/g, d => koreanDigits[parseInt(d)]);
    }
    return str;
};

// --- Holiday API ---
interface ApiHoliday {
    date: string;
    localName: string;
    name: string;
    countryCode: string;
}

// Simulated cache
let holidayCache: Record<string, ApiHoliday[]> = {};

export const fetchHolidays = async (year: number, countryCode: string): Promise<ApiHoliday[]> => {
    const key = `${year}-${countryCode}`;
    if (holidayCache[key]) return holidayCache[key];

    let holidays: ApiHoliday[] = [];

    try {
        // Primary: Nager.Date
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
        if (response.ok) {
            const data: ApiHoliday[] = await response.json();
            holidays = [...holidays, ...data];
        }
    } catch (e) {
        console.warn("Nager API failed", e);
    }

    // Secondary for Indonesia: Dayoff API
    if (countryCode === 'ID') {
        try {
            const res = await fetch(`https://dayoffapi.vercel.app/api?year=${year}`);
            if (res.ok) {
                const data = await res.json();
                const idHolidays = data.map((h: any) => ({
                    date: h.date,
                    localName: h.keterangan,
                    name: h.keterangan,
                    countryCode: 'ID'
                }));
                // Merge avoiding duplicates
                idHolidays.forEach((h: ApiHoliday) => {
                    if (!holidays.some(ex => ex.date === h.date)) {
                        holidays.push(h);
                    }
                });
            }
        } catch (e) {
            console.warn("Dayoff API failed", e);
        }
    }

    holidayCache[key] = holidays;
    return holidays;
}

// --- Export Logic ---
export const exportToICS = (events: CustomEvent[], holidays: ApiHoliday[]) => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Digicald//EN\n";
    
    const addToIcs = (title: string, date: string, desc: string = '') => {
        const d = date.replace(/-/g, '');
        icsContent += "BEGIN:VEVENT\n";
        icsContent += `DTSTART;VALUE=DATE:${d}\n`;
        icsContent += `DTEND;VALUE=DATE:${d}\n`;
        icsContent += `SUMMARY:${title}\n`;
        icsContent += `DESCRIPTION:${desc}\n`;
        icsContent += "END:VEVENT\n";
    };

    events.forEach(e => addToIcs(e.title, e.date, e.notes));
    holidays.forEach(h => addToIcs(h.name, h.date, h.localName));

    icsContent += "END:VCALENDAR";
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'digicald_events.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const getFormattedDateString = (date: Date, type: CalendarType, locale: string): string => {
    if (type === CalendarType.JAVANESE) {
        const weton = getWeton(date);
        const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(date);
        const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(date);
        const year = date.getFullYear();
        const d = getNativeDateDigit(date.getDate(), type);
        const y = getNativeDateDigit(year, type);
        return `${dayName} ${weton}, ${d} ${monthName} ${y}`; 
    }

    if (type === CalendarType.HIJRI) {
        const fmt = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        return fmt.format(date);
    }

    if (type === CalendarType.CHINESE || type === CalendarType.BAZI) {
        return new Intl.DateTimeFormat('zh-CN-u-ca-chinese', { dateStyle: 'full' }).format(date);
    }
    
    if (type === CalendarType.JAPANESE) {
        return new Intl.DateTimeFormat('ja-JP-u-ca-japanese', { dateStyle: 'full' }).format(date);
    }
    
    if (type === CalendarType.KOREAN) {
         return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'full' }).format(date);
    }
    
    if (type === CalendarType.THAI) {
        return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', { dateStyle: 'full' }).format(date);
    }

    if (type === CalendarType.IRANIAN) {
        return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'full' }).format(date);
    }
    
    if (type === CalendarType.HINDI) {
         return new Intl.DateTimeFormat('hi-IN-u-ca-indian', { dateStyle: 'full' }).format(date);
    }

    return new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(date);
}

export const getMonthData = (
    year: number, 
    month: number, 
    type: CalendarType, 
    countryCode: string, 
    locale: string, 
    customEvents: CustomEvent[],
    tasks: Task[],
    apiHolidays: ApiHoliday[]
): CalendarDay[] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 = Sunday

    const days: CalendarDay[] = [];

    // Padding
    for (let i = 0; i < startingDay; i++) {
        days.push({ 
            day: 0, month, year, isToday: false, isHoliday: false, nativeDateStr: '', nativeDay: '' 
        });
    }

    const today = new Date();

    for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(year, month, i);
        const isToday = currentDate.getDate() === today.getDate() && 
                        currentDate.getMonth() === today.getMonth() && 
                        currentDate.getFullYear() === today.getFullYear();
        
        const dateStrIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const foundHoliday = apiHolidays.find(h => h.date === dateStrIso);
        
        let nativeDay = getNativeDateDigit(i, type);
        let nativeDateStr = '';
        let weton = '';
        let zodiac = '';
        let ganzhi = '';

        if (type === CalendarType.JAVANESE) {
            weton = getWeton(currentDate);
            nativeDateStr = getFormattedDateString(currentDate, type, locale);
        } else if (type === CalendarType.CHINESE || type === CalendarType.BAZI) {
             const cYear = parseInt(new Intl.DateTimeFormat('en-US-u-ca-chinese', {year:'numeric'}).format(currentDate));
             ganzhi = getGanZhi(cYear);
             zodiac = getZodiac(cYear);
             nativeDateStr = getFormattedDateString(currentDate, type, locale);
        } else {
            nativeDateStr = getFormattedDateString(currentDate, type, locale);
        }

        const dayEvents = customEvents.filter(e => e.date === dateStrIso);
        const dayTasks = tasks.filter(t => t.date === dateStrIso && !t.isCompleted);
        const hasTasks = dayTasks.length > 0;
        
        const hasReminders = dayTasks.some(t => !!t.reminderTime) || dayEvents.some(e => !!e.reminderMinutes || !!e.time);

        days.push({
            day: i,
            month,
            year,
            isToday,
            isHoliday: !!foundHoliday,
            holidayName: foundHoliday?.localName || foundHoliday?.name,
            holidayCountry: foundHoliday ? countryCode : undefined,
            nativeDateStr,
            nativeDay,
            weton,
            zodiac,
            ganzhi,
            events: dayEvents,
            hasTasks,
            hasReminders
        });
    }

    return days;
};
