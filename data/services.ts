/**
 * خدمات البرمجة والتطوير. كل الأسعار بالريال السعودي وشاملة ضريبة القيمة المضافة.
 * السعر هنا «يبدأ من»؛ يُعتمد عرض السعر النهائي بعد تحليل المتطلبات.
 */
export type IconKey =
  | 'globe' | 'store' | 'smartphone' | 'layout' | 'cpu' | 'credit-card' | 'receipt' | 'plug'
  | 'search' | 'wrench' | 'network' | 'camera' | 'server' | 'mail' | 'shield' | 'file' | 'palette' | 'qr' | 'calendar' | 'book';

export type Service = {
  id: string;
  name: string;
  price: number;
  unit: 'يبدأ من' | 'شهريًا' | 'لمرة واحدة';
  summary: string;
  features: string[];
  delivery: string;
  icon: IconKey;
};

export type WebsitePackage = {
  id: string;
  name: string;
  price: number;
  pitch: string;
  delivery: string;
  support: string;
  features: string[];
  featured?: boolean;
};

export const websitePackages: WebsitePackage[] = [
  {
    id: 'web-starter',
    name: 'الانطلاقة',
    price: 2900,
    pitch: 'موقع تعريفي أنيق لمنشأة تبدأ حضورها الرقمي.',
    delivery: '10 أيام عمل',
    support: 'دعم فني 30 يومًا',
    features: ['حتى 5 صفحات', 'تصميم متجاوب مع الجوال', 'نموذج تواصل وزر واتساب', 'تهيئة أساسية لمحركات البحث', 'ربط Google Analytics', 'شهادة SSL مجانية'],
  },
  {
    id: 'web-business',
    name: 'الأعمال',
    price: 5900,
    pitch: 'موقع ثنائي اللغة بلوحة تحكم لإدارة المحتوى بنفسك.',
    delivery: '21 يوم عمل',
    support: 'دعم فني 60 يومًا',
    featured: true,
    features: ['حتى 12 صفحة', 'عربي وإنجليزي', 'لوحة تحكم لإدارة المحتوى', 'مدونة وأخبار', 'تحسين السرعة وتقييم Core Web Vitals', 'استضافة سنة مجانًا (باقة أعمال)'],
  },
  {
    id: 'web-pro',
    name: 'الاحترافية',
    price: 11900,
    pitch: 'منصة مخصصة بمزايا تفاعلية وتكاملات مع أنظمتك.',
    delivery: '35 يوم عمل',
    support: 'دعم فني 90 يومًا',
    features: ['صفحات غير محدودة', 'تصميم واجهات UI/UX مخصص', 'حسابات مستخدمين ونماذج متقدمة', 'ربط API مع أنظمة خارجية', 'لوحة تقارير وإحصاءات', 'تسليم الكود المصدري'],
  },
];

export type ServiceGroup = { id: string; title: string; intro: string; services: Service[] };

export const serviceGroups: ServiceGroup[] = [
  {
    id: 'commerce',
    title: 'المتاجر الإلكترونية',
    intro: 'من الإطلاق السريع على المنصات الجاهزة إلى متجر مخصص بالكامل.',
    services: [
      { id: 'salla-zid', name: 'إطلاق متجر على سلة أو زد', price: 1800, unit: 'يبدأ من', icon: 'store', delivery: '7 أيام عمل', summary: 'تهيئة المتجر ورفع حتى 50 منتجًا وضبط الشحن والدفع.', features: ['تخصيص الثيم بهوية علامتك', 'ضبط بوابات الدفع والشحن', 'صفحات السياسات والتعريف', 'تدريب على إدارة الطلبات'] },
      { id: 'custom-store', name: 'متجر إلكتروني مخصص', price: 6900, unit: 'يبدأ من', icon: 'globe', delivery: '30 يوم عمل', summary: 'متجر سريع مبني بتقنيات حديثة بلا عمولات منصات.', features: ['سلة ودفع مدى وApple Pay', 'لوحة إدارة المنتجات والطلبات', 'فاتورة ضريبية مبسطة', 'ربط شركات الشحن'] },
    ],
  },
  {
    id: 'apps',
    title: 'تطبيقات الجوال',
    intro: 'تطبيقات iOS وAndroid بكود واحد وأداء قريب من التطبيقات الأصلية.',
    services: [
      { id: 'mobile-app', name: 'تطبيق جوال iOS وAndroid', price: 18000, unit: 'يبدأ من', icon: 'smartphone', delivery: '45–60 يوم عمل', summary: 'تصميم وتطوير ونشر التطبيق على المتجرين.', features: ['تصميم واجهات وتجربة مستخدم', 'إشعارات فورية', 'لوحة تحكم ويب', 'النشر على App Store وGoogle Play'] },
      { id: 'pwa', name: 'تطبيق ويب تقدمي PWA', price: 7500, unit: 'يبدأ من', icon: 'layout', delivery: '21 يوم عمل', summary: 'تجربة تطبيق على الجوال بدون رسوم المتاجر.', features: ['يعمل دون اتصال جزئيًا', 'إضافة للشاشة الرئيسية', 'إشعارات المتصفح', 'تحديثات فورية دون مراجعة المتاجر'] },
    ],
  },
  {
    id: 'systems',
    title: 'الأنظمة والتكامل',
    intro: 'أنظمة داخلية تختصر العمل اليدوي وتربط أدواتك ببعضها.',
    services: [
      { id: 'custom-system', name: 'نظام ويب مخصص', price: 12000, unit: 'يبدأ من', icon: 'cpu', delivery: 'حسب النطاق', summary: 'إدارة حجوزات، مخزون، عملاء، أو سير عمل خاص بمنشأتك.', features: ['تحليل متطلبات ونموذج أولي', 'صلاحيات وأدوار للمستخدمين', 'تقارير قابلة للتصدير', 'تسليم الكود والتوثيق'] },
      { id: 'payment-gateway', name: 'ربط بوابة دفع', price: 1500, unit: 'يبدأ من', icon: 'credit-card', delivery: '5 أيام عمل', summary: 'ربط مدى وفيزا وApple Pay وSTC Pay عبر مزود دفع مرخص.', features: ['بيئة اختبار ثم تشغيل فعلي', 'إشعارات الدفع webhook', 'صفحات نجاح وفشل الدفع', 'اختبار شامل قبل الإطلاق'] },
      { id: 'e-invoicing', name: 'ربط الفوترة الإلكترونية', price: 3500, unit: 'يبدأ من', icon: 'receipt', delivery: '10 أيام عمل', summary: 'ربط نظامك تقنيًا بمنصة «فاتورة» حسب متطلبات المرحلة الثانية.', features: ['توليد رمز QR والفاتورة', 'الربط مع بوابة الهيئة', 'بيئة محاكاة قبل الإنتاج', 'توثيق خطوات التشغيل'] },
      { id: 'api-integration', name: 'ربط API وأتمتة', price: 2500, unit: 'يبدأ من', icon: 'plug', delivery: '7 أيام عمل', summary: 'ربط متجرك أو نظامك مع الشحن، المحاسبة، أو واتساب للأعمال.', features: ['تحليل الواجهات البرمجية', 'معالجة الأخطاء وإعادة المحاولة', 'سجلات متابعة', 'دعم بعد التسليم'] },
    ],
  },
  {
    id: 'care',
    title: 'التحسين والدعم',
    intro: 'نحافظ على موقعك سريعًا وآمنًا ومحدثًا بعد الإطلاق.',
    services: [
      { id: 'maintenance', name: 'صيانة ودعم شهري', price: 499, unit: 'شهريًا', icon: 'wrench', delivery: 'يبدأ فورًا', summary: 'تحديثات أمنية ونسخ احتياطي وتعديلات بسيطة كل شهر.', features: ['حتى 5 ساعات تعديل شهريًا', 'مراقبة توفر الموقع', 'تحديثات أمنية', 'تقرير شهري'] },
      { id: 'seo', name: 'تحسين محركات البحث SEO', price: 1500, unit: 'شهريًا', icon: 'search', delivery: 'نتائج تدريجية خلال 3 أشهر', summary: 'تحسين تقني ومحتوى يستهدف عملاءك في المملكة.', features: ['تدقيق تقني شامل', 'بحث الكلمات المفتاحية', 'تحسين صفحات المنتجات', 'تقرير أداء شهري'] },
      { id: 'speed-audit', name: 'تدقيق السرعة والأمان', price: 900, unit: 'لمرة واحدة', icon: 'shield', delivery: '5 أيام عمل', summary: 'تقرير عملي يرتب أولويات تحسين موقعك الحالي.', features: ['قياس Core Web Vitals', 'فحص الثغرات الشائعة', 'خطة إصلاح مرتبة', 'جلسة شرح 30 دقيقة'] },
    ],
  },
  {
    id: 'field',
    title: 'خدمات تقنية ميدانية',
    intro: 'تكمل منتجات المتجر: تصميم وتنفيذ شبكات وأنظمة مراقبة للمنشآت.',
    services: [
      { id: 'network-design', name: 'تصميم وتنفيذ شبكة منشأة', price: 2500, unit: 'يبدأ من', icon: 'network', delivery: 'حسب الموقع', summary: 'تمديد وتهيئة شبكة سلكية ولاسلكية للمكاتب والمحلات.', features: ['زيارة ومسح الموقع', 'مخطط توزيع نقاط الوصول', 'تهيئة الشبكات الفرعية والضيوف', 'توثيق كلمات المرور والإعدادات'] },
      { id: 'cctv-project', name: 'مشروع كاميرات للمنشآت', price: 3500, unit: 'يبدأ من', icon: 'camera', delivery: 'حسب الموقع', summary: 'تصميم وتوريد وتركيب نظام مراقبة متكامل.', features: ['دراسة الزوايا والتغطية', 'توريد الأجهزة من متجرنا', 'برمجة المشاهدة عن بعد', 'ضمان التركيب 3 أشهر'] },
    ],
  },
];

export const allServices = serviceGroups.flatMap((group) => group.services);
