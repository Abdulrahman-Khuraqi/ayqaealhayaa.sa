/** خطط الاستضافة والنطاقات. الأسعار بالريال السعودي وشاملة ضريبة القيمة المضافة. */
export type HostingPlan = {
  id: string;
  name: string;
  monthly: number;
  /** السعر السنوي يعادل 10 أشهر: شهران مجانًا. */
  yearly: number;
  pitch: string;
  specs: string[];
  featured?: boolean;
};

export type HostingFamily = { id: string; title: string; intro: string; plans: HostingPlan[] };

const yearly = (monthly: number) => monthly * 10;

export const hostingFamilies: HostingFamily[] = [
  {
    id: 'shared',
    title: 'استضافة المواقع',
    intro: 'لمواقع الشركات والمدونات والمتاجر الصغيرة، مع لوحة تحكم سهلة.',
    plans: [
      { id: 'host-start', name: 'بداية', monthly: 29, yearly: yearly(29), pitch: 'لموقع واحد يبدأ رحلته.', specs: ['موقع واحد', '10 جيجابايت NVMe', '5 حسابات بريد', 'SSL مجاني', 'نسخ احتياطي أسبوعي'] },
      { id: 'host-business', name: 'أعمال', monthly: 59, yearly: yearly(59), pitch: 'الخيار الأنسب لأغلب المنشآت.', featured: true, specs: ['حتى 5 مواقع', '50 جيجابايت NVMe', '25 حساب بريد', 'SSL مجاني', 'نسخ احتياطي يومي', 'نطاق .com مجاني أول سنة (اشتراك سنوي)'] },
      { id: 'host-pro', name: 'احترافية', monthly: 99, yearly: yearly(99), pitch: 'لمواقع أكثر زيارات وموارد.', specs: ['مواقع غير محدودة', '100 جيجابايت NVMe', 'بريد غير محدود', 'SSL مجاني', 'نسخ احتياطي يومي', 'موارد معالجة مضاعفة'] },
    ],
  },
  {
    id: 'wordpress',
    title: 'ووردبريس المُدارة',
    intro: 'نتولى التحديثات والحماية والتسريع، وتتفرغ أنت للمحتوى.',
    plans: [
      { id: 'wp-standard', name: 'ووردبريس قياسي', monthly: 79, yearly: yearly(79), pitch: 'موقع ووردبريس سريع وآمن.', specs: ['موقع واحد', '20 جيجابايت NVMe', 'تحديثات تلقائية للإضافات', 'جدار حماية للتطبيقات', 'تخزين مؤقت متقدم'] },
      { id: 'wp-commerce', name: 'ووو كومرس', monthly: 149, yearly: yearly(149), pitch: 'لمتاجر WooCommerce النشطة.', featured: true, specs: ['حتى 3 مواقع', '60 جيجابايت NVMe', 'بيئة تجربة Staging', 'مراقبة الأداء', 'نسخ احتياطي يومي باسترجاع بنقرة'] },
    ],
  },
  {
    id: 'vps',
    title: 'الخوادم السحابية VPS',
    intro: 'موارد مخصصة وصلاحيات كاملة للتطبيقات والأنظمة.',
    plans: [
      { id: 'vps-1', name: 'VPS 1', monthly: 149, yearly: yearly(149), pitch: 'تطبيقات صغيرة وبيئات اختبار.', specs: ['2 معالج vCPU', '4 جيجابايت ذاكرة', '80 جيجابايت NVMe', 'نقل بيانات 3 تيرابايت', 'عنوان IPv4 مخصص'] },
      { id: 'vps-2', name: 'VPS 2', monthly: 279, yearly: yearly(279), pitch: 'أنظمة الأعمال والمتاجر المتوسطة.', featured: true, specs: ['4 معالج vCPU', '8 جيجابايت ذاكرة', '160 جيجابايت NVMe', 'نقل بيانات 5 تيرابايت', 'لقطات احتياطية Snapshots'] },
      { id: 'vps-3', name: 'VPS 3', monthly: 499, yearly: yearly(499), pitch: 'أحمال عالية وقواعد بيانات كبيرة.', specs: ['8 معالج vCPU', '16 جيجابايت ذاكرة', '320 جيجابايت NVMe', 'نقل بيانات 8 تيرابايت', 'إدارة ومراقبة أساسية'] },
    ],
  },
  {
    id: 'email',
    title: 'بريد الأعمال',
    intro: 'بريد احترافي باسم نطاقك، يعمل على الجوال وOutlook.',
    plans: [
      { id: 'mail-basic', name: 'بريد أساسي', monthly: 9, yearly: yearly(9), pitch: 'لكل مستخدم.', specs: ['10 جيجابايت لكل صندوق', 'حماية من الرسائل المزعجة', 'IMAP/SMTP وواجهة ويب'] },
      { id: 'mail-pro', name: 'بريد احترافي', monthly: 19, yearly: yearly(19), pitch: 'لكل مستخدم.', featured: true, specs: ['50 جيجابايت لكل صندوق', 'تقويم وجهات اتصال مشتركة', 'أرشفة وفلترة متقدمة'] },
    ],
  },
];

export type Domain = { id: string; tld: string; price: number; renewal: number; note?: string };

export const domains: Domain[] = [
  { id: 'dom-sa', tld: '.sa', price: 160, renewal: 160, note: 'يتطلب سجلًا تجاريًا أو ما يثبت الكيان' },
  { id: 'dom-com-sa', tld: '.com.sa', price: 160, renewal: 160, note: 'للمنشآت التجارية السعودية' },
  { id: 'dom-com', tld: '.com', price: 55, renewal: 65 },
  { id: 'dom-net', tld: '.net', price: 65, renewal: 75 },
  { id: 'dom-store', tld: '.store', price: 25, renewal: 220, note: 'سعر ترويجي للسنة الأولى' },
  { id: 'dom-online', tld: '.online', price: 25, renewal: 150, note: 'سعر ترويجي للسنة الأولى' },
];

export const allHostingPlans = hostingFamilies.flatMap((family) => family.plans);
