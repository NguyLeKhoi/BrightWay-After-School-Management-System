import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import MainHeader from '../../Headers/MainHeader';
import Footer from '../../Common/Footer';
import ScrollToTop from '../../Common/ScrollToTop';
import PageTransition from '../../Common/PageTransition';
import ScrollTriggerWrapper from '../../Common/ScrollTriggerWrapper';
import styles from './MainLayout.module.css';

const MainLayout = ({ showHeader = true, showFooter = true }) => {
  const location = useLocation();
  
  // Enable ScrollTrigger only for homepage, disable for contact, packages, facilities, and FAQ
  const isContactPage = location.pathname === '/contact';
  const isPackagesPage = location.pathname === '/packages';
  const isFacilitiesPage = location.pathname === '/facilities';
  const isFAQPage = location.pathname === '/faq';
  const enableScrollTrigger = !isContactPage && !isPackagesPage && !isFacilitiesPage && !isFAQPage;

  return (
    <div className={styles.mainLayout}>
      <ScrollToTop />
      {showHeader && <MainHeader />}
      
      <main className={styles.mainContent}>
        <PageTransition>
          <ScrollTriggerWrapper enabled={enableScrollTrigger}>
            <Outlet />
          </ScrollTriggerWrapper>
        </PageTransition>
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
};

export default MainLayout;
