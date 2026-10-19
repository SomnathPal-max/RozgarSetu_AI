'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bookmark, Shield, User } from 'lucide-react';
import { type Locale } from '@/i18n/config';

interface BottomNavProps {
  locale: Locale;
}

export function BottomNav({ locale }: BottomNavProps) {
  const t = useTranslations('common');
  const pathname = usePathname();
  const [isReviewer, setIsReviewer] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in as reviewer/admin per access control rules
    const cookies = document.cookie.split(';').map((c) => c.trim());
    const hasReviewer = cookies.some(
      (c) =>
        c.startsWith('rozgarsetu_role=reviewer') ||
        c.startsWith('rozgarsetu_role=reviewer2') ||
        c.startsWith('rozgarsetu_role=admin')
    );
    const inAdminArea = pathname.includes('/admin') && !pathname.includes('/admin/login');
    setIsReviewer(hasReviewer || inAdminArea);

    const hasSession = cookies.some((c) => c.startsWith('rozgarsetu_session='));
    setIsLoggedIn(hasSession);
  }, [pathname]);

  const navItems = [
    { href: `/${locale}`, label: t('home'), icon: Home },
    { href: `/${locale}/saved`, label: t('saved'), icon: Bookmark },
    ...(isReviewer
      ? [{ href: `/${locale}/admin`, label: t('admin'), icon: Shield }]
      : [
          {
            href: isLoggedIn ? `/${locale}/saved` : `/${locale}/auth/login`,
            label: isLoggedIn ? t('myAccount') : t('login'),
            icon: User,
          },
        ]),
  ];

  return (
    <nav className="no-print sticky bottom-0 bg-white border-t border-slate-200 flex justify-around py-2 shadow-lg" aria-label="Main navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href ||
          (item.href !== `/${locale}` && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-4 py-2 min-h-[44px] min-w-[44px] rounded-lg transition-colors ${
              isActive
                ? 'text-blue-600 font-medium'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
            <span className="text-xs">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
