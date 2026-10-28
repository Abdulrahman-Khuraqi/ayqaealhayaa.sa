const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

/** الأسعار بالأرقام اللاتينية مع رمز الريال، وهي الصيغة الأوضح على الجوال. */
export const formatPrice = (value: number) => `${number.format(value)} ر.س`;

export const formatNumber = (value: number) => number.format(value);

/** الأسعار شاملة الضريبة؛ هذه حصة ضريبة القيمة المضافة منها. */
export const vatPortion = (grossTotal: number, rate = 0.15) => Math.round((grossTotal * rate / (1 + rate)) * 100) / 100;

/** توحيد الكتابة العربية للبحث: الهمزات والتاء المربوطة والألف المقصورة والتشكيل. */
export function normalizeArabic(input: string) {
  return input
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ـ/g, '')
    .trim();
}

/** جوال سعودي: 05xxxxxxxx أو 9665xxxxxxxx مع أو بدون +. */
export const SAUDI_MOBILE = /^(05\d{8}|\+?9665\d{8})$/;
