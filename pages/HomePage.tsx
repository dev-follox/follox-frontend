import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Link2,
  Play,
  Shield,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import DemoPreview from '../components/landing/DemoPreview';
import LandingHeader from '@/components/LandingHeader';
import { useTranslation } from '../hooks/useTranslation';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6 },
  }),
};

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <DemoPreview open={demoOpen} onClose={() => setDemoOpen(false)} />
      <LandingHeader onTryDemo={() => setDemoOpen(true)} />

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <img src="/assets/hero-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[#1E2022]/40" />

        <div className="container relative z-10 mx-auto px-4 pt-16 text-center">
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="mx-auto max-w-4xl text-4xl font-bold uppercase tracking-wide text-foreground md:text-5xl lg:text-6xl"
          >
            {t('landingV2.hero.title')}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={1}
            initial="hidden"
            animate="visible"
            className="mx-auto mt-6 max-w-2xl text-lg text-secondary-alpha md:text-xl"
          >
            {t('landingV2.hero.subtitle')}
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={2}
            initial="hidden"
            animate="visible"
            className="mt-10 flex flex-wrap justify-center gap-4"
          >
            <Link to="/login">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
              >
                {t('landingV2.hero.ctaStart')} <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <button
              type="button"
              onClick={() => setDemoOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-semibold text-foreground transition-colors hover:border-primary/50"
            >
              <Play className="h-4 w-4" />
              {t('landingV2.hero.ctaDemo')}
            </button>
          </motion.div>

          <motion.div
            variants={fadeUp}
            custom={3}
            initial="hidden"
            animate="visible"
            className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-secondary-alpha"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" /> {t('landingV2.hero.badges.freeForDesigners')}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" /> {t('landingV2.hero.badges.automaticCalculation')}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" /> {t('landingV2.hero.badges.qrAffiliateLinks')}
            </span>
          </motion.div>
        </div>
      </section>

      <section className="bg-card py-24">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-center text-3xl font-bold uppercase tracking-wide text-foreground md:text-4xl">{t('landingV2.howItWorks.title')}</h2>
          <p className="mx-auto mb-16 max-w-xl text-center text-secondary-alpha">
            {t('landingV2.howItWorks.subtitle')}
          </p>
          <div className="grid gap-0 md:grid-cols-3">
            {[
              { icon: Users, title: t('landingV2.howItWorks.steps.invite.title'), desc: t('landingV2.howItWorks.steps.invite.desc'), step: '01' },
              { icon: Store, title: t('landingV2.howItWorks.steps.bring.title'), desc: t('landingV2.howItWorks.steps.bring.desc'), step: '02' },
              { icon: Calculator, title: t('landingV2.howItWorks.steps.calculate.title'), desc: t('landingV2.howItWorks.steps.calculate.desc'), step: '03' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`relative p-10 text-center ${i < 2 ? 'border-border md:border-r' : ''}`}
              >
                <span className="absolute right-6 top-4 text-5xl font-bold text-foreground/5">{item.step}</span>
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center">
                  <item.icon className="h-7 w-7 text-stone" strokeWidth={1.5} />
                </div>
                <h3 className="mb-2 text-lg font-semibold uppercase tracking-wide text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-secondary-alpha">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="mb-16 text-center text-3xl font-bold uppercase tracking-wide text-foreground md:text-4xl">{t('landingV2.why.title')}</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Shield, title: t('landingV2.why.cards.payouts.title'), desc: t('landingV2.why.cards.payouts.desc') },
              { icon: TrendingUp, title: t('landingV2.why.cards.analytics.title'), desc: t('landingV2.why.cards.analytics.desc') },
              { icon: Link2, title: t('landingV2.why.cards.qr.title'), desc: t('landingV2.why.cards.qr.desc') },
              { icon: Calculator, title: t('landingV2.why.cards.auto.title'), desc: t('landingV2.why.cards.auto.desc') },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border border-border bg-card p-6 transition-colors duration-300 hover:border-primary/30"
              >
                <item.icon className="mb-4 h-5 w-5 text-stone" strokeWidth={1.5} />
                <h3 className="mb-1.5 text-sm font-semibold uppercase tracking-wide text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-secondary-alpha">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-card py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-16 text-3xl font-bold uppercase tracking-wide text-foreground md:text-4xl">
            {t('landingV2.pricing.title')}
          </h2>

          <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative border-2 border-primary bg-background p-8"
            >
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-3 py-1 text-xs font-semibold text-white">
                {t('landingV2.pricing.company.badge')}
              </span>
              <Store className="mx-auto mb-4 h-7 w-7 text-primary" strokeWidth={1.5} />
              <h3 className="mb-2 text-lg font-bold uppercase text-foreground">{t('landingV2.pricing.company.title')}</h3>

              <div className="mb-1 font-mono text-4xl font-bold text-primary">
                {t('landingV2.pricing.company.price')}
                <span className="text-base font-normal text-secondary-alpha">{t('landingV2.pricing.company.per')}</span>
              </div>
              <p className="mb-6 text-sm text-secondary-alpha">{t('landingV2.pricing.company.note')}</p>

              <ul className="mb-8 space-y-3 text-left text-sm">
                {[
                  'landingV2.pricing.company.features.fullAccess',
                  'landingV2.pricing.company.features.unlimitedDesigners',
                  'landingV2.pricing.company.features.catalog',
                  'landingV2.pricing.company.features.gamification',
                  'landingV2.pricing.company.features.analytics',
                ].map((k) => (
                  <li key={k} className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary" />
                    {t(k)}
                  </li>
                ))}
              </ul>

              <Link to="/login">
                <button className="w-full bg-primary px-6 py-2 font-semibold text-white transition-colors hover:bg-primary/90">
                  {t('landingV2.pricing.company.cta')}
                </button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="border border-border bg-background p-8"
            >
              <Users className="mx-auto mb-4 h-7 w-7 text-stone" strokeWidth={1.5} />
              <h3 className="mb-2 text-lg font-bold uppercase text-foreground">{t('landingV2.pricing.designer.title')}</h3>
              <div className="mb-1 font-mono text-4xl font-bold text-foreground">{t('landingV2.pricing.designer.price')}</div>
              <p className="mb-6 text-sm text-secondary-alpha">{t('landingV2.pricing.designer.note')}</p>

              <ul className="mb-8 space-y-3 text-left text-sm">
                {[
                  'landingV2.pricing.designer.features.access',
                  'landingV2.pricing.designer.features.catalog',
                  'landingV2.pricing.designer.features.tracking',
                  'landingV2.pricing.designer.features.apply',
                ].map((k) => (
                  <li key={k} className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-stone" />
                    {t(k)}
                  </li>
                ))}
              </ul>

              <Link to="/designers/register">
                <button className="w-full border border-foreground/20 bg-transparent px-6 py-2 font-semibold text-foreground transition-colors hover:bg-foreground/5">
                  {t('landingV2.pricing.designer.cta')}
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-footer py-10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <span className="font-semibold uppercase tracking-wider text-foreground">{t('landingV2.footer.brand')}</span>
          <p className="text-sm text-secondary-alpha">{t('landingV2.footer.email')}</p>
          <p className="text-sm text-secondary-alpha">
            © {new Date().getFullYear()} {t('landingV2.footer.brand')}. {t('landingV2.footer.rights')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
