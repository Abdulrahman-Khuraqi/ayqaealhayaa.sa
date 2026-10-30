/** بيانات المنشأة المعتمدة. أي تعديل على التواصل أو العنوان يتم هنا فقط. */
export const site = {
  name: 'إيقاع الحياة',
  legalName: 'شركة إيقاع الحياة',
  tagline: 'تقنية تحمي يومك، وحلول رقمية تبني أعمالك',
  url: 'https://ayqaealhayaa.sa',
  /** موقع الدفع (PayOne): تُرسل إليه السلة عند إتمام الطلب. */
  payUrl: 'https://pay.ayqaealhayaa.sa',
  commercialRegistration: '7033944427',
  vatNumber: '311685924700003',
  /** صفة الاعتماد: تظهر في الرئيسية والتذييل. */
  authorizedDistributor: 'موزع معتمد من مزودي خدمات الاتصالات',
  vatRate: 0.15,
  email: 'cs@ayqaealhayaa.sa',
  phone: '0570070539',
  phoneIntl: '966570070539',
  city: 'الرياض',
  address: 'الرياض، حي السلي، المملكة العربية السعودية',
  hours: 'السبت – الخميس، 9 ص – 9 م',
  shippingNotice: 'شحن مجاني داخل المملكة العربية السعودية',
  returnDays: 10,
  legalUpdatedAt: '28 أكتوبر 2026',
} as const;

export const whatsappLink = (text?: string) =>
  `https://wa.me/${site.phoneIntl}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const mainNav = [
  { href: '/store/', label: 'المتجر' },
  { href: '/about/', label: 'من نحن' },
  { href: '/contact/', label: 'تواصل معنا' },
] as const;
