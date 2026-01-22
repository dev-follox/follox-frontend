import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LandingHeader from '../components/LandingHeader';
import AuthModal from '../components/AuthModal';
import ToolsOverviewBlock from '../components/ToolsOverviewBlock';
import Button from '../components/Button';
import { useTranslation } from '../hooks/useTranslation';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const openAuthModal = () => {
    localStorage.setItem('selectedModule', 'tools');
    setAuthModalOpen(true);
  };

  return (
    <div className="landing-page">
      <LandingHeader onTryForFree={openAuthModal} />

      <main className="landing-main">
        {/* Block 1. Hero */}
        {/* <div class="landing-block1"> */}
        <section className="landing-hero">
          <div className="container container--lg">
            <h1 className="landing-hero__title">
              {t('landing.hero.title1')}
              <span className="landing-hero__highlight">{t('landing.hero.titleHighlight')}</span>
              {t('landing.hero.title2')}
            </h1>
            <p className="landing-hero__subtitle">{t('landing.hero.subtitle')}</p>
            <div className="landing-hero__cta">
              <Button onClick={openAuthModal} className="landing-hero__btn">
                {t('landing.hero.cta')}
              </Button>
              </div>
            </div>
          </section>
        

        {/* Space for screencast */}
        <section className="landing-screencast">
          <div className="container container--lg">
            <div className="landing-screencast__placeholder" />
          </div>
        </section>
        {/* </div> */}

        {/* Block 2. Built for the moments */}
        <section className="landing-block2">
          <div className="container container--lg">
            <h2 className="landing-block2__title">{t('landing.block2.title')}</h2>
            <p className="landing-block2__text">{t('landing.block2.text')}</p>
          </div>
        </section>

        {/* Block 3. Tools overview */}
        <section className="landing-block3" id="tools">
          <div className="container container--lg">
            <div className="landing-tools-wrap">
              <ToolsOverviewBlock />
            </div>
            <div className="landing-tools-cta">
              <Button onClick={openAuthModal} variant="primary" className="landing-hero__btn">
                {t('landing.toolsCta')}
              </Button>
            </div>
          </div>
        </section>

        {/* Block 5. Footer */}
        <footer className="landing-footer">
          <div className="container container--lg">
            <div className="landing-footer__grid">
              <div className="landing-footer__brand">
                <div className="landing-footer__logo">{t('landing.footer.brand')}</div>
                <p className="landing-footer__tagline">{t('landing.footer.tagline')}</p>
                <p className="landing-footer__rights">{t('landing.footer.rights')}</p>
              </div>
              <div className="landing-footer__support">
                <h4 className="landing-footer__heading">{t('landing.footer.support')}</h4>
                <a href="/documents/privacy-policy.docx" download className="landing-footer__link">
                  {t('landing.footer.privacyPolicy')}
                </a>
                <a href="/documents/terms-of-service.docx" download className="landing-footer__link">
                  {t('landing.footer.termsOfService')}
                </a>
                <a href={`mailto:${t('landing.footer.email')}`} className="landing-footer__link">
                  {t('landing.footer.email')}
                </a>
              </div>
              <div className="landing-footer__tools">
                <h4 className="landing-footer__heading">{t('landing.footer.tools')}</h4>
                <Link to="/tools/icp-diagnostician" className="landing-footer__link">
                  {t('sidebar.icpDiagnostician')}
                </Link>
                <Link to="/tools/positioning" className="landing-footer__link">
                  {t('sidebar.positioning')}
                </Link>
                <Link to="/tools/channel-risk" className="landing-footer__link">
                  {t('sidebar.channelRisk')}
                </Link>
                <Link to="/tools/experiment" className="landing-footer__link">
                  {t('sidebar.experiment')}
                </Link>
                <Link to="/tools/decision-review" className="landing-footer__link">
                  {t('sidebar.decisionReview')}
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};

export default HomePage;
