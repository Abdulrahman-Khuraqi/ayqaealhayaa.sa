# نقل وتشغيل متجر إيقاع الحياة للتقنية

هذه الحزمة تحتوي مصدر الموقع كاملًا، بما في ذلك كتالوج المنتجات، أصول الصور، الخادم، وتكوين الحاوية. لا تحتوي أي مفاتيح دفع أو بيانات قاعدة بيانات سرية.

## المتطلبات

- Node.js 22 أو أحدث.
- pnpm 11.
- قاعدة MySQL عند تشغيل الطلبات والدفع خارج Manus.
- حساب Stripe ومفاتيحه الحية عند تفعيل الدفع الفعلي.

## التشغيل محليًا

```bash
cp .env.example .env
pnpm install
pnpm dev
```

يفتح الخادم افتراضيًا على المنفذ `3000`.

## الإعداد قبل الإطلاق

حدّث ملف `.env` بالقيم الحقيقية التالية:

- `APP_ORIGIN`: رابط النطاق العام للمتجر، من دون `/` في النهاية.
- `DATABASE_URL`: رابط اتصال MySQL؛ من دونه يعمل عرض الكتالوج لكن لن تُحفظ الطلبات بشكل دائم.
- `STRIPE_SECRET_KEY` و`STRIPE_WEBHOOK_SECRET`: مفاتيح Stripe الحية.
- `VITE_STRIPE_PUBLISHABLE_KEY`: المفتاح العام لـStripe المستخدم في الواجهة.

لا تنسَ إضافة رابط webhook في Stripe إلى:

```text
https://YOUR-DOMAIN/api/stripe/webhook
```

## البناء والإنتاج

```bash
pnpm check
pnpm build
pnpm start
```

أو استخدم الحاوية المرفقة:

```bash
docker build -t iqaa-life-store .
docker run --env-file .env -p 3000:3000 iqaa-life-store
```

## محتويات مهمة

- `src/`: واجهة React العربية.
- `server/`: الخادم، الطلبات، وقناة Stripe webhook.
- `data/`: كتالوج المنتجات والفئات.
- `public/images/payment-trust.png`: صورة وسائل الدفع والتوثيق التي أضافها المالك؛ أصبحت محلية ضمن الحزمة.
- `.env.example`: قالب متغيرات البيئة بلا أسرار.
