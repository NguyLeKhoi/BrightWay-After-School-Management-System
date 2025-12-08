import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroSection from '@components/Common/HeroSection';
import ContentSection from '@components/Common/ContentSection';
import Card from '@components/Common/Card';
import ContentLoading from '@components/Common/ContentLoading';
import facilityService from '../../../services/facility.service';
import packageService from '../../../services/package.service';
import { useApp } from '../../../contexts/AppContext';
import styles from './CombinedLanding.module.css';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const CombinedLanding = () => {
  const navigate = useNavigate();
  const { showGlobalError } = useApp();
  const [facilities, setFacilities] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(true);

  // Refs for scroll sections
  const homepageRef = useRef(null);
  const facilitiesRef = useRef(null);
  const packagesRef = useRef(null);
  const triggersRef = useRef([]);

  // Setup scroll trigger animations
  useEffect(() => {
    // Clean up existing triggers
    triggersRef.current.forEach(trigger => trigger.kill());
    triggersRef.current = [];

    const setupScrollTriggers = () => {
      // Helper function to check if element is in viewport
      const isInViewport = (el) => {
        const rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
      };

      // Animate homepage section
      if (homepageRef.current) {
        const allElements = homepageRef.current.querySelectorAll('h1, h2, p, img');
        
        // Only set initial state if not in viewport
        allElements.forEach((el) => {
          if (!isInViewport(el)) {
            gsap.set(el, { opacity: 0, y: 30 });
          } else {
            gsap.set(el, { opacity: 1, y: 0 });
          }
        });

        const trigger = ScrollTrigger.create({
          trigger: homepageRef.current,
          start: 'top 85%',
          once: true, // Only trigger once
          onEnter: () => {
            gsap.to(allElements, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.1,
              ease: 'power2.out',
            });
          },
        });
        triggersRef.current.push(trigger);
      }

      // Animate facilities section
      if (facilitiesRef.current) {
        const textElements = facilitiesRef.current.querySelectorAll('h2, p');
        const imageElements = facilitiesRef.current.querySelectorAll('img');
        const cardElements = facilitiesRef.current.querySelectorAll('[class*="card"]');
        
        const allElements = facilitiesRef.current.querySelectorAll('h2, p, img, [class*="card"]');
        allElements.forEach((el) => {
          if (!isInViewport(el)) {
            gsap.set(el, { opacity: 0, y: 30 });
          } else {
            gsap.set(el, { opacity: 1, y: 0 });
          }
        });

        const trigger = ScrollTrigger.create({
          trigger: facilitiesRef.current,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            const timeline = gsap.timeline();
            
            // Animate text and images slowly
            if (textElements.length > 0) {
              timeline.to(textElements, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power2.out',
              }, 0);
            }
            
            if (imageElements.length > 0) {
              timeline.to(imageElements, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power2.out',
              }, 0);
            }
            
            // Animate cards faster with delay
            if (cardElements.length > 0) {
              timeline.to(cardElements, {
                opacity: 1,
                y: 0,
                duration: 0.3,
                stagger: 0.02,
                ease: 'power2.out',
              }, 0.3);
            }
          },
        });
        triggersRef.current.push(trigger);
      }

      // Animate packages section
      if (packagesRef.current) {
        const textElements = packagesRef.current.querySelectorAll('h2, p');
        const imageElements = packagesRef.current.querySelectorAll('img');
        const cardElements = packagesRef.current.querySelectorAll('[class*="card"]');
        
        const allElements = packagesRef.current.querySelectorAll('h2, p, img, [class*="card"]');
        allElements.forEach((el) => {
          if (!isInViewport(el)) {
            gsap.set(el, { opacity: 0, y: 30 });
          } else {
            gsap.set(el, { opacity: 1, y: 0 });
          }
        });

        const trigger = ScrollTrigger.create({
          trigger: packagesRef.current,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            const timeline = gsap.timeline();
            
            // Animate text and images slowly
            if (textElements.length > 0) {
              timeline.to(textElements, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power2.out',
              }, 0);
            }
            
            if (imageElements.length > 0) {
              timeline.to(imageElements, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power2.out',
              }, 0);
            }
            
            // Animate cards faster with delay
            if (cardElements.length > 0) {
              timeline.to(cardElements, {
                opacity: 1,
                y: 0,
                duration: 0.3,
                stagger: 0.02,
                ease: 'power2.out',
              }, 0.3);
            }
          },
        });
        triggersRef.current.push(trigger);
      }

      ScrollTrigger.refresh();
    };

    // Setup after DOM is ready
    const timeoutId = setTimeout(setupScrollTriggers, 150);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      triggersRef.current.forEach(trigger => trigger.kill());
      triggersRef.current = [];
    };
  }, []);

  // Fetch facilities
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoadingFacilities(true);
        const response = await facilityService.getPublicFacilities();
        const facilitiesData = Array.isArray(response) ? response : (response.items || []);
        setFacilities(facilitiesData);
      } catch (error) {
        console.error('Error fetching facilities:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Không thể tải danh sách cơ sở vật chất. Vui lòng thử lại sau.';
        showGlobalError(errorMessage);
        setFacilities([]);
      } finally {
        setLoadingFacilities(false);
      }
    };

    fetchFacilities();
  }, [showGlobalError]);

  // Fetch packages
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoadingPackages(true);
        const response = await packageService.getPublicPackages();
        const packagesData = Array.isArray(response) ? response : (response.items || []);
        setPackages(packagesData);
      } catch (error) {
        console.error('Error fetching packages:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Không thể tải danh sách gói dịch vụ. Vui lòng thử lại sau.';
        showGlobalError(errorMessage);
        setPackages([]);
      } finally {
        setLoadingPackages(false);
      }
    };

    fetchPackages();
  }, [showGlobalError]);

  // Format price to VND
  const formatPrice = (price) => {
    if (!price) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Format duration
  const formatDuration = (months) => {
    if (!months) return 'N/A';
    return `${months} tháng`;
  };

  // Convert package data to card format
  const formatPackageToCard = (pkg) => {
    const infoRows = [];
    
    if (pkg.studentLevel?.name) {
      infoRows.push({ label: 'Cấp độ', value: pkg.studentLevel.name });
    }
    
    if (pkg.durationInMonths) {
      infoRows.push({ label: 'Thời gian', value: formatDuration(pkg.durationInMonths) });
    }
    
    if (pkg.totalSlots) {
      infoRows.push({ label: 'Số buổi', value: `${pkg.totalSlots} buổi` });
    }
    
    if (pkg.price) {
      infoRows.push({ label: 'Giá', value: formatPrice(pkg.price) });
    }

    if (pkg.branch?.name) {
      infoRows.push({ label: 'Chi nhánh', value: pkg.branch.name });
    }

    return {
      id: pkg.id,
      title: pkg.name || 'Gói dịch vụ',
      description: pkg.desc || 'Không có mô tả',
      infoRows: infoRows,
      actions: [
        { 
          text: 'Đăng ký', 
          primary: true, 
          onClick: () => {
            navigate('/contact');
          }
        }
      ]
    };
  };

  const MAX_FACILITIES_DISPLAY = 6;
  const MAX_PACKAGES_DISPLAY = 6;
  const MAX_FEATURED_PACKAGES = 3;

  const bestPackages = packages.slice(0, MAX_PACKAGES_DISPLAY).map(formatPackageToCard);
  const featuredPackages = packages.slice(0, MAX_FEATURED_PACKAGES).map(formatPackageToCard);

  // Section images
  const section1Image = (
    <img 
      src="/images/1.png" 
      alt="Nhân viên chăm sóc và trẻ em"
      className={styles.contentImage}
    />
  );

  const section2Image = (
    <img 
      src="/images/2.png" 
      alt="Môi trường chăm sóc trẻ an toàn và hiện đại"
      className={styles.contentImage}
    />
  );

  const facilitiesImage = (
    <img 
      src="/images/4.jpg" 
      alt="Cơ sở vật chất hiện đại - Không gian chăm sóc trẻ an toàn"
      className={styles.contentImage}
    />
  );

  const aboutImage = (
    <img 
      src="/images/5.jpg" 
      alt="Môi trường chăm sóc trẻ với thiết bị hiện đại"
      className={styles.contentImage}
    />
  );

  const heroImage = (
    <img 
      src="/images/3.jpg" 
      alt="Các gói dịch vụ giữ trẻ tại BRIGHTWAY"
      className={styles.heroImageImg}
    />
  );

  // Content sections
  const features = ['Chăm Sóc Chuyên Nghiệp', 'Hoạt Động Đa Dạng', 'Cơ Sở Vật Chất An Toàn'];

  const contentSection1 = {
    heading: 'Về BRIGHTWAY',
    subheading: 'Nơi giữ trẻ an toàn và tin cậy',
    description: 'BRIGHTWAY là dịch vụ giữ trẻ sau giờ học với các hoạt động ngoài giờ đa dạng, phong phú. Chúng tôi cam kết mang đến môi trường an toàn, vui vẻ và bổ ích cho trẻ em với đội ngũ nhân viên chăm sóc chuyên nghiệp và cơ sở vật chất hiện đại.',
    features: features,
    hasImage: true,
    imageContent: section1Image
  };

  const contentSection2 = {
    heading: 'Tại Sao Chọn Chúng Tôi',
    subheading: 'Cam kết chất lượng chăm sóc trẻ',
    description: 'Chúng tôi cung cấp dịch vụ giữ trẻ chất lượng cao với các hoạt động ngoài giờ đa dạng, được thiết kế để trẻ em phát triển toàn diện về thể chất, tinh thần và kỹ năng xã hội trong môi trường an toàn và vui vẻ.',
    hasImage: true,
    reverse: true,
    imageContent: section2Image
  };

  const facilitiesSection = {
    heading: 'Cơ Sở Vật Chất Của Chúng Tôi',
    subheading: 'Môi trường chăm sóc trẻ an toàn và hiện đại',
    description: 'Chúng tôi tự hào về hệ thống cơ sở vật chất hiện đại, được trang bị đầy đủ thiết bị và không gian an toàn để mang đến trải nghiệm chăm sóc tốt nhất cho trẻ em sau giờ học.',
    hasImage: true,
    imageContent: facilitiesImage
  };

  const aboutSection = {
    heading: 'Về Chúng Tôi',
    subheading: 'Cam kết với chất lượng chăm sóc trẻ',
    description: 'Với nhiều năm kinh nghiệm trong lĩnh vực chăm sóc trẻ sau giờ học, chúng tôi luôn đặt chất lượng và sự phát triển của trẻ em lên hàng đầu. Đội ngũ nhân viên chăm sóc của chúng tôi được tuyển chọn kỹ lưỡng và thường xuyên được đào tạo nâng cao.',
    hasImage: true,
    reverse: true,
    imageContent: aboutImage
  };

  const missionData = {
    heading: 'Sứ Mệnh Của Chúng Tôi',
    description: 'BRIGHTWAY cam kết mang đến môi trường chăm sóc tốt nhất cho trẻ em sau giờ học, với đội ngũ nhân viên chăm sóc chuyên nghiệp, cơ sở vật chất hiện đại và các hoạt động ngoài giờ đa dạng, phong phú. Chúng tôi tin rằng mỗi trẻ em đều có tiềm năng phát triển và chúng tôi sẽ đồng hành cùng các em trong quá trình phát triển toàn diện.',
    hasImage: false
  };

  return (
    <div className={styles.combinedLanding}>
      {/* HOMEPAGE SECTION */}
      <div id="section-homepage" ref={homepageRef} className={styles.section}>
        <div className={styles.homepage}>
          <div className={styles.heroWithImage}>
            <h1 className={styles.mainHeroTitle}>BRIGHTWAY - After School Management</h1>
            <p className={styles.mainHeroSubtitle}>Nơi giữ trẻ an toàn với các hoạt động ngoài giờ phong phú và bổ ích</p>
            <div className={styles.mainHeroImageWrapper}>{heroImage}</div>
          </div>

          <div>
            <ContentSection {...contentSection1} />
          </div>

          <div>
            <ContentSection {...contentSection2} />
          </div>
        </div>
      </div>

      {/* FACILITIES SECTION */}
      <div id="section-facilities" ref={facilitiesRef} className={styles.section}>
        <div className={styles.facilitiesAbout}>
          <div>
            <ContentSection {...facilitiesSection} />
          </div>
          
          <div>
            <ContentSection {...aboutSection} />
          </div>
          
          {/* Facilities List Section */}
          <section className={styles.contentSection}>
            <div className={styles.contentContainer}>
              <h2 className={styles.sectionHeading}>
                Danh Sách Cơ Sở Vật Chất
              </h2>
              {loadingFacilities ? (
                <ContentLoading text="Đang tải thông tin cơ sở vật chất..." />
              ) : facilities.length > 0 ? (
                <div className={styles.facilitiesGrid}>
                  {facilities.slice(0, MAX_FACILITIES_DISPLAY).map((facility) => (
                    <div key={facility.id}>
                      <Card
                        title={facility.facilityName || 'Cơ sở vật chất'}
                        description={facility.description || 'Không có mô tả'}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <p>Hiện tại chưa có cơ sở vật chất nào. Vui lòng quay lại sau.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* PACKAGES SECTION */}
      <div id="section-packages" ref={packagesRef} className={styles.section}>
        <div className={styles.packageCatalog}>
          <div className={styles.packageHeroCustom}>
            <h1 className={styles.packageTitleSmall}>Danh Mục Gói Dịch Vụ</h1>
            <h2 className={styles.packageSubtitleSmall}>Khám phá các gói dịch vụ giữ trẻ với hoạt động ngoài giờ đa dạng</h2>
          </div>

          {/* Article Section */}
          <section className={styles.contentSection}>
            <div className={styles.contentContainer}>
              <article className={styles.article}>
                <p className={styles.articleText}>
                  Chào mừng bạn đến với danh mục gói dịch vụ của BRIGHTWAY! Chúng tôi cung cấp các gói dịch vụ giữ trẻ đa dạng, 
                  được thiết kế phù hợp với từng độ tuổi và nhu cầu của trẻ em. Mỗi gói dịch vụ bao gồm các hoạt động ngoài giờ 
                  phong phú, giúp trẻ phát triển toàn diện về thể chất, tinh thần và kỹ năng xã hội trong môi trường an toàn và vui vẻ.
                </p>

                <p className={styles.articleText}>
                  Tất cả các gói dịch vụ của chúng tôi đều được quản lý bởi đội ngũ nhân viên chăm sóc trẻ chuyên nghiệp, 
                  giàu kinh nghiệm. Các hoạt động được thiết kế đa dạng, từ vui chơi, thể thao, nghệ thuật đến các hoạt động 
                  phát triển kỹ năng. Chúng tôi cam kết mang đến môi trường an toàn, vui vẻ và bổ ích cho trẻ em.
                </p>
              </article>
            </div>
          </section>

          {/* Best Packages Section */}
          <section className={styles.bestPackagesSection}>
            <div className={styles.bestPackagesContainer}>
              <h2 className={styles.sectionHeading}>
                Các Gói Dịch Vụ Nổi Bật
              </h2>
              {loadingPackages ? (
                <ContentLoading text="Đang tải danh sách gói dịch vụ..." />
              ) : bestPackages.length > 0 ? (
                <div className={styles.bestPackagesGrid}>
                  {bestPackages.map((pkg) => (
                    <div key={pkg.id}>
                      <Card
                        title={pkg.title}
                        description={pkg.description}
                        infoRows={pkg.infoRows}
                        actions={pkg.actions}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <p>Hiện tại chưa có gói dịch vụ nào. Vui lòng quay lại sau.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CombinedLanding;
