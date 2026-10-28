'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';
import AddToCart from './AddToCart';
import { hostingFamilies } from '@/data/hosting';
import { formatPrice } from '@/lib/format';

export default function HostingPlans() {
  const [familyId, setFamilyId] = useState(hostingFamilies[0].id);
  const [yearly, setYearly] = useState(true);
  const family = hostingFamilies.find((f) => f.id === familyId) ?? hostingFamilies[0];
  const perUser = family.id === 'email';

  return (
    <div>
      <div className="family-tabs" role="tablist" aria-label="أنواع الاستضافة">
        {hostingFamilies.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={f.id === familyId} onClick={() => setFamilyId(f.id)}>{f.title}</button>
        ))}
      </div>
      <div className="hosting-bar">
        <p>{family.intro}</p>
        <div className="billing-switch" role="group" aria-label="مدة الاشتراك">
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>شهري</button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>سنوي <em>شهران مجانًا</em></button>
        </div>
      </div>
      <div className="tiers light-tiers" role="tabpanel">
        {family.plans.map((plan) => {
          const price = yearly ? plan.yearly : plan.monthly;
          const period = yearly ? 'سنويًا' : 'شهريًا';
          return (
            <article key={plan.id} id={plan.id} className={`tier ${plan.featured ? 'featured' : ''}`}>
              {plan.featured && <span className="tier-flag">الأنسب لأغلب العملاء</span>}
              <h3>{plan.name}</h3>
              <p className="tier-pitch">{plan.pitch}</p>
              <div className="tier-price">
                <strong>{formatPrice(price)}</strong>
                <span>{perUser ? `لكل مستخدم ${period}` : period}</span>
                {yearly && <span className="from">يعادل {formatPrice(Math.round((plan.yearly / 12) * 100) / 100)} شهريًا</span>}
              </div>
              <ul>{plan.specs.map((spec) => <li key={spec}><Check size={16} aria-hidden="true" />{spec}</li>)}</ul>
              <AddToCart
                label="اشترك الآن"
                variant={plan.featured ? 'solid' : 'outline'}
                item={{ key: `hosting:${plan.id}:${yearly ? 'y' : 'm'}`, kind: 'hosting', name: `${family.title} — ${plan.name}`, price, href: `/hosting/#${plan.id}`, note: perUser ? `لكل مستخدم ${period}` : `اشتراك ${yearly ? 'سنوي' : 'شهري'}` }}
              />
            </article>
          );
        })}
      </div>
    </div>
  );
}
