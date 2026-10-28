import type { IconKey } from './services';

/** المنتجات الرقمية: تُسلَّم إلكترونيًا. الأسعار بالريال السعودي وشاملة ضريبة القيمة المضافة. */
export type DigitalProduct = {
  id: string;
  name: string;
  price: number;
  unit: 'لمرة واحدة' | 'سنويًا' | 'شهريًا';
  category: 'الأمان' | 'القوالب' | 'الأنظمة السحابية' | 'أدلة ومخططات';
  summary: string;
  includes: string[];
  delivery: string;
  icon: IconKey;
  badge?: string;
};

export const digitalProducts: DigitalProduct[] = [
  { id: 'ssl-dv', name: 'شهادة SSL للنطاق', price: 99, unit: 'سنويًا', category: 'الأمان', icon: 'shield', delivery: 'إصدار خلال ساعات', summary: 'تشفير DV لنطاق واحد مع علامة القفل في المتصفح.', includes: ['نطاق واحد مع www', 'تثبيت مجاني على استضافتنا', 'تذكير قبل التجديد'] },
  { id: 'ssl-wildcard', name: 'شهادة SSL Wildcard', price: 549, unit: 'سنويًا', category: 'الأمان', icon: 'shield', delivery: 'إصدار خلال يوم عمل', summary: 'تحمي النطاق وجميع النطاقات الفرعية بشهادة واحدة.', includes: ['نطاقات فرعية غير محدودة', 'دعم التثبيت', 'ضمان المُصدِر'] },
  { id: 'ssl-ov', name: 'شهادة SSL موثقة المنشأة OV', price: 399, unit: 'سنويًا', category: 'الأمان', icon: 'shield', delivery: '1–3 أيام عمل', summary: 'تعرض بيانات منشأتك الموثقة داخل الشهادة.', includes: ['التحقق من السجل التجاري', 'مساعدة في إجراءات التوثيق', 'مناسبة للبوابات والأنظمة'] },
  { id: 'tpl-corporate', name: 'قالب موقع شركات عربي', price: 349, unit: 'لمرة واحدة', category: 'القوالب', icon: 'layout', badge: 'الأكثر طلبًا', delivery: 'تحميل فوري بعد الدفع', summary: 'قالب Next.js متجاوب يدعم العربية والإنجليزية.', includes: ['8 صفحات جاهزة', 'كود مصدري كامل', 'دليل تخصيص', 'ترخيص لموقع واحد'] },
  { id: 'tpl-landing', name: 'قالب صفحة هبوط للحملات', price: 149, unit: 'لمرة واحدة', category: 'القوالب', icon: 'file', delivery: 'تحميل فوري بعد الدفع', summary: 'صفحة إعلانية سريعة بنموذج طلب وزر واتساب.', includes: ['3 تنسيقات ألوان', 'نموذج تواصل', 'تهيئة لبكسل الإعلانات'] },
  { id: 'tpl-social', name: 'حزمة قوالب سوشل ميديا', price: 149, unit: 'لمرة واحدة', category: 'القوالب', icon: 'palette', delivery: 'تحميل فوري بعد الدفع', summary: '30 تصميمًا قابلًا للتعديل للمنشورات والقصص.', includes: ['ملفات Figma وCanva', 'خطوط عربية مجانية الترخيص', 'مقاسات إنستقرام وسناب وX'] },
  { id: 'saas-qr-menu', name: 'منيو رقمي QR للمطاعم', price: 79, unit: 'شهريًا', category: 'الأنظمة السحابية', icon: 'qr', delivery: 'تفعيل خلال 24 ساعة', summary: 'قائمة طعام رقمية تحدثها بنفسك مع رمز QR للطاولات.', includes: ['عربي وإنجليزي', 'صور وأسعار وسعرات حرارية', 'رموز QR جاهزة للطباعة', 'تحديث فوري'] },
  { id: 'saas-booking', name: 'نظام حجوزات ومواعيد', price: 149, unit: 'شهريًا', category: 'الأنظمة السحابية', icon: 'calendar', delivery: 'تفعيل خلال 24 ساعة', summary: 'صفحة حجز إلكتروني للصالونات والعيادات والمراكز.', includes: ['تذكير بالمواعيد', 'إدارة الموظفين والخدمات', 'تقارير الحجوزات', 'رابط حجز خاص بك'] },
  { id: 'guide-cctv-plan', name: 'مخطط توزيع كاميرات لمنشأتك', price: 149, unit: 'لمرة واحدة', category: 'أدلة ومخططات', icon: 'camera', delivery: 'خلال 3 أيام عمل', summary: 'ترسل لنا المخطط أو الصور، ونسلمك ملف PDF بمواقع الكاميرات المقترحة.', includes: ['زوايا التغطية المقترحة', 'قائمة الأجهزة المناسبة', 'تقدير تكلفة من متجرنا'] },
  { id: 'guide-app-setup', name: 'دليل إعداد تطبيقات المراقبة', price: 29, unit: 'لمرة واحدة', category: 'أدلة ومخططات', icon: 'book', delivery: 'تحميل فوري بعد الدفع', summary: 'خطوات مصورة بالعربي لتطبيقات DMSS وImou Life وEZVIZ.', includes: ['ربط الكاميرا بالجوال', 'مشاركة الصلاحيات مع العائلة', 'ضبط التنبيهات والتسجيل'] },
];
