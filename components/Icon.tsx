import {
  BookOpen, Calendar, Camera, Cpu, CreditCard, FileCode2, Globe, LayoutTemplate, Mail, Network, Palette, Plug,
  QrCode, Receipt, Search, Server, ShieldCheck, Smartphone, Store, Wrench, type LucideIcon,
} from 'lucide-react';
import type { IconKey } from '@/data/services';

const icons: Record<IconKey, LucideIcon> = {
  globe: Globe, store: Store, smartphone: Smartphone, layout: LayoutTemplate, cpu: Cpu, 'credit-card': CreditCard,
  receipt: Receipt, plug: Plug, search: Search, wrench: Wrench, network: Network, camera: Camera, server: Server,
  mail: Mail, shield: ShieldCheck, file: FileCode2, palette: Palette, qr: QrCode, calendar: Calendar, book: BookOpen,
};

export default function Icon({ name, size = 22 }: { name: IconKey; size?: number }) {
  const Component = icons[name];
  return <Component size={size} strokeWidth={1.6} aria-hidden="true" />;
}
