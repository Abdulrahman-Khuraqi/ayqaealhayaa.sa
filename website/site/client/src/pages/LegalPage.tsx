/**
 * اتجاه الملف: صفحات قانونية واضحة ضمن هوية «الحِرفة التسويقية الداكنة»؛
 * بنية تحريرية قابلة للقراءة، تباين عالٍ، ووصول مباشر لروابط الثقة والتواصل.
 */
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, Mail, MapPin, MessageCircle, PackageCheck, ReceiptText, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";

const LOGO = "/manus-storage/ayqae-logo-mark_dc786b30.png";
const WHATSAPP = "https://wa.me/966570070539";

type LegalPageProps = { page: "terms" | "privacy" };

function LegalHeader() {
  return <header className="legal-header"><Link href="/" className="brand-mark"><img src={LOGO} alt="علامة إيقاع الحياة" /><span><strong>إيقاع</strong><small>الحياة</small></span></Link><Link href="/" className="back-home">العودة للرئيسية <ArrowLeft size={16} /></Link></header>;
}

function LegalFooter() {
  return <footer className="legal-footer"><span>© 2026 إيقاع الحياة</span><div><Link href="/terms">الشروط والأحكام</Link><Link href="/privacy-refund">الخصوصية والاسترداد</Link></div></footer>;
}

export default function LegalPage({ page }: LegalPageProps) {
  const isTerms = page === "terms";
  const content = trpc.store.publicContent.useQuery().data ?? {};
  return <div className="legal-shell"><LegalHeader /><main className="legal-main"><div className="legal-hero"><p className="eyebrow"><ShieldCheck size={15} /> روابط الثقة والشفافية</p><h1>{isTerms ? <>الشروط<br /><em>والأحكام</em></> : <>الخصوصية<br /><em>والاسترداد</em></>}</h1><p>آخر تحديث: 1 سبتمبر 2026</p></div>{isTerms ? <TermsContent lead={content.terms_summary} full={content.terms_full} /> : <PrivacyRefundContent privacyLead={content.privacy_summary} refundLead={content.refund_summary} privacyFull={content.privacy_full} refundFull={content.refund_full} />}</main><LegalFooter /></div>;
}

function TermsContent({ lead, full }: { lead?: string; full?: string }) {
  if (full) return <article className="legal-content"><p className="legal-lead legal-managed-copy">{full}</p><ContactBlock /></article>;
  return <article className="legal-content"><p className="legal-lead">{lead || "تنظم هذه الشروط استخدام موقع إيقاع الحياة وطلب المنتجات والخدمات المعروضة فيه. باستخدام الموقع أو إرسال طلب، فإنك تقر باطلاعك على هذه الشروط وعلى سياسة الخصوصية والاسترداد."}</p><LegalSection n="01" title="نطاق الخدمات والمنتجات"><p>يعرض الموقع خدمات تسويق وتصميم وحلول عرض تسويقية ومنتجات تشمل شاشات العرض والستاندات. قد تختلف التفاصيل والمواصفات ومدة التنفيذ بحسب نوع المنتج أو الخدمة ونطاق العمل المتفق عليه.</p></LegalSection><LegalSection n="02" title="الأسعار وإتمام الطلب"><p>تظهر الأسعار بالريال السعودي أو يوضح أن السعر «عند الطلب». يُؤكد السعر النهائي وأي رسوم أو ضرائب وطريقة الدفع وموعد التنفيذ أو التسليم قبل إتمام التعاقد. لا يعد وضع المنتج في السلة أو إرسال الاستفسار موافقة نهائية على الطلب إلا بعد تأكيده.</p></LegalSection><LegalSection n="03" title="الطلب عبر واتساب"><p>تتم متابعة الطلبات والتأكيد حاليًا عبر واتساب. يلتزم العميل بتقديم بيانات تواصل صحيحة ومعلومات كافية لتنفيذ طلبه. لا تطلب إيقاع الحياة معلومات البطاقات المصرفية عبر واتساب؛ يرجى عدم إرسالها في أي رسالة.</p></LegalSection><LegalSection n="04" title="التسليم وتنفيذ الخدمات"><p>يحدد نطاق التوصيل ومواعيده وتكاليفه النهائية في تأكيد الطلب وفق نوع المنتج ومكان التسليم. وتبدأ خدمات التصميم أو التسويق وفق النطاق والمواد والمواعيد والمراجعات المعتمدة بين الطرفين. سنبلغ العميل بأي تأخر متوقع يؤثر في موعد التسليم أو التنفيذ.</p></LegalSection><LegalSection n="05" title="الملكية الفكرية"><p>تظل حقوق العلامة والنصوص والتصاميم والصور والمحتوى الخاص بالموقع لإيقاع الحياة أو لأصحاب الحقوق فيها. ولا يجوز نسخها أو إعادة استخدامها دون موافقة خطية. وتحدد حقوق استخدام مخرجات الخدمة المخصصة في العرض أو الاتفاق أو الفاتورة المعتمدة، وبعد سداد المستحقات كاملة.</p></LegalSection><LegalSection n="06" title="التزامات العميل"><p>يتعهد العميل باستخدام الموقع بصورة مشروعة، وتقديم بيانات صحيحة، وامتلاك أو الحصول على التصاريح اللازمة لاستخدام أي مواد أو شعارات أو صور أو نصوص يطلب تضمينها في الخدمة.</p></LegalSection><LegalSection n="07" title="حدود المسؤولية والنظام المطبق"><p>نبذل عناية معقولة لدقة المعلومات وتوفر الموقع، وقد تطرأ تغييرات في الأسعار أو التوفر أو المواصفات. لا نحد من أي مسؤولية أو حق لا يجيز النظام حده. تخضع هذه الشروط للأنظمة النافذة في المملكة العربية السعودية، ونسعى لمعالجة أي استفسار أو شكوى وديًا أولًا عبر وسائل التواصل المنشورة.</p></LegalSection><ContactBlock /></article>;
}

function PrivacyRefundContent({ privacyLead, refundLead, privacyFull, refundFull }: { privacyLead?: string; refundLead?: string; privacyFull?: string; refundFull?: string }) {
  if (privacyFull || refundFull) return <article className="legal-content">{privacyFull && <LegalSection n="01" title="سياسة الخصوصية"><p className="legal-managed-copy">{privacyFull}</p></LegalSection>}{refundFull && <section id="refund" className="refund-panel"><div className="refund-title"><CheckCircle2 /><div><p>سياسة الاسترداد</p><h2>طلب واضح، وحل منصف.</h2></div></div><p className="legal-managed-copy">{refundFull}</p></section>}<ContactBlock /></article>;
  return <article className="legal-content"><p className="legal-lead">{privacyLead || "تحترم إيقاع الحياة خصوصية زوار الموقع وعملائه. توضح هذه الصفحة كيف نتعامل مع البيانات التي تقدمها، وحقوقك المتعلقة بها، وشروط الاسترداد والاستبدال للطلبات المؤهلة."}</p><LegalSection n="01" title="البيانات التي قد نجمعها"><p>قد نجمع الاسم ورقم الجوال والبريد الإلكتروني ومحتوى رسالتك وتفاصيل المنتج أو الخدمة المطلوبة. وقد نحتاج بيانات إضافية مثل مدينة أو عنوان التسليم عندما تكون ضرورية لتنفيذ طلب مؤكد.</p></LegalSection><LegalSection n="02" title="أغراض استخدام البيانات"><p>نستخدم البيانات للرد على الاستفسارات وتأكيد وتنفيذ الطلبات وتقديم الدعم والوفاء بالالتزامات النظامية وحماية الموقع. لا نبيع البيانات الشخصية. ولا نرسل رسائل تسويقية مباشرة إلا وفق الموافقة أو الضوابط النظامية المطبقة.</p></LegalSection><LegalSection n="03" title="السلة والتواصل عبر واتساب"><p>يستخدم الموقع تخزين المتصفح المحلي لحفظ محتوى السلة على جهازك، ويمكنك حذفه من إعدادات المتصفح. عند إرسال نموذج التواصل أو إتمام طلب عبر واتساب، تخضع معالجة المحادثة كذلك لسياسات واتساب؛ لذلك لا ترسل معلومات حساسة أو تفاصيل بطاقات دفع عبر هذه القناة.</p></LegalSection><LegalSection n="04" title="مشاركة البيانات وحمايتها"><p>قد نشارك الحد الأدنى اللازم من البيانات مع مزود الاستضافة أو الشحن أو الدفع عند تفعيله، أو مع جهات يلزمها النظام، وبالقدر الضروري لتشغيل الخدمة وتنفيذ الطلب. نتخذ تدابير فنية وتنظيمية معقولة لحماية البيانات من الوصول أو الاستخدام غير المصرح به.</p></LegalSection><LegalSection n="05" title="مدة الاحتفاظ والحقوق"><p>نحتفظ بالبيانات للمدة اللازمة للغرض الذي جمعت من أجله أو التي يتطلبها النظام. يمكنك طلب معرفة أغراض جمع بياناتك أو الوصول إليها أو الحصول على نسخة منها أو تصحيحها أو تحديثها أو طلب إتلافها عند انتفاء الحاجة، وكذلك سحب الموافقة حيثما كانت هي الأساس. لطلب ذلك، راسلنا عبر البريد الإلكتروني أو واتساب الموضحين أدناه.</p></LegalSection><section id="refund" className="refund-panel"><div className="refund-title"><CheckCircle2 /><div><p>سياسة الاسترداد</p><h2>طلب واضح، وحل منصف.</h2></div></div><p>{refundLead || "يلتزم المتجر بحقوق المستهلك المقررة نظامًا. يتيح الموقع طلب الاستبدال أو الاسترجاع خلال 10 أيام من استلام المنتج، متى لم يستخدم وكان بحالته الأصلية مع ملحقاته وتغليفه بما يلائم طبيعة المنتج."}</p><div className="refund-grid"><div><h3>يحق لك طلب الاسترداد أو الاستبدال عند</h3><ul><li>وصول منتج معيب أو غير مطابق للطلب.</li><li>وجود خطأ في المنتج المرسل من جانبنا.</li><li>استيفاء شروط الإرجاع خلال المدة المحددة.</li></ul></div><div><h3>لا ينطبق الاسترداد عادةً على</h3><ul><li>المنتج المصنوع أو المخصص بطلب العميل، إلا عند العيب أو عدم المطابقة.</li><li>الخدمة التي بدأ تنفيذها أو استفاد منها العميل.</li><li>المنتج المتضرر نتيجة سوء الاستخدام.</li></ul></div></div><p className="refund-note">قد يتحمل العميل تكلفة الإرجاع أو الإلغاء ما لم نتفق على خلاف ذلك أو كان السبب عيبًا أو خطأً من جانبنا. لبدء الطلب، تواصل معنا فورًا وأرفق وصفًا واضحًا وصورًا عند توفرها.</p></section><LegalSection n="06" title="تحديث هذه السياسة"><p>قد نحدّث هذه الصفحة عندما تتغير الخدمات أو الممارسات أو المتطلبات النظامية. تُنشر النسخة الجديدة هنا مع تاريخ آخر تحديث.</p></LegalSection><ContactBlock /></article>;
}

function LegalSection({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return <section className="legal-section"><span>{n}</span><div><h2>{title}</h2>{children}</div></section>;
}

function ContactBlock() {
  const content = trpc.store.publicContent.useQuery().data ?? {};
  const email = content.contact_email || "cs@ayqaealhayaa.sa";
  const phone = content.contact_phone || "0570070539";
  const whatsapp = `https://wa.me/966${phone.replace(/\D/g, "").replace(/^0/, "")}`;
  const shipping = content.shipping_notice || "شحن مجاني داخل المملكة العربية السعودية";
  const address = content.business_address || "الرياض، حي السلي";
  const registration = content.commercial_registration || "7033944427";
  return <aside className="legal-contact"><h2>هل تحتاج مساعدة؟</h2><p>نسعد بالرد على استفساراتك أو طلبات الخصوصية أو الاسترداد.</p><div><a href={`mailto:${email}`}><Mail size={17} /> {email}</a><a href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={17} /> {phone}</a></div><div className="legal-business-details"><span><PackageCheck size={16} /> {shipping}</span><span><MapPin size={16} /> {content.business_address_label || "العنوان التجاري"}: {address}</span><span><ReceiptText size={16} /> {content.commercial_registration_label || "السجل التجاري"}: {registration}</span></div></aside>;
}
