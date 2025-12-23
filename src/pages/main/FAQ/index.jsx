import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  alpha
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  HelpOutline as HelpIcon,
  QuestionAnswer as QuestionAnswerIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const FAQ = () => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const faqData = [
    {
      question: 'BRIGHTWAY là gì?',
      answer: 'BRIGHTWAY là hệ thống quản lý nhà trẻ chuyên nghiệp, cung cấp dịch vụ chăm sóc trẻ em sau giờ học với môi trường an toàn, giáo dục toàn diện và các hoạt động phong phú. Chúng tôi cam kết mang đến dịch vụ tốt nhất cho trẻ em và phụ huynh.'
    },
    {
      question: 'Độ tuổi nào phù hợp để tham gia BRIGHTWAY?',
      answer: 'BRIGHTWAY phù hợp cho trẻ em từ mầm non đến tiểu học (từ 3-12 tuổi). Chúng tôi có các chương trình và hoạt động được thiết kế phù hợp với từng độ tuổi để đảm bảo trẻ phát triển toàn diện.'
    },
    {
      question: 'Làm thế nào để đăng ký cho con tham gia?',
      answer: 'Bạn có thể đăng ký cho con tham gia BRIGHTWAY bằng cách: (1) Liên hệ trực tiếp với chúng tôi qua số điện thoại hoặc email, (2) Đăng ký trực tuyến trên website, (3) Đến trực tiếp tại cơ sở của chúng tôi. Nhân viên sẽ hướng dẫn bạn hoàn tất thủ tục đăng ký và chọn gói dịch vụ phù hợp.'
    },
    {
      question: 'Các gói dịch vụ có những gì?',
      answer: 'BRIGHTWAY cung cấp nhiều gói dịch vụ đa dạng phù hợp với nhu cầu của từng gia đình. Các gói dịch vụ bao gồm: chăm sóc cơ bản, chăm sóc kèm bữa ăn, chăm sóc kèm hoạt động ngoại khóa, và gói Pro với đầy đủ dịch vụ. Mỗi gói có các lợi ích và mức giá khác nhau. Vui lòng liên hệ để được tư vấn chi tiết.'
    },
    {
      question: 'Làm thế nào để thanh toán học phí?',
      answer: 'Phụ huynh có thể thanh toán học phí qua nhiều hình thức: (1) Thanh toán trực tiếp tại cơ sở, (2) Chuyển khoản ngân hàng, (3) Thanh toán qua ứng dụng di động BRIGHTWAY bằng ví điện tử. Hệ thống sẽ tự động gửi hóa đơn và thông báo thanh toán cho phụ huynh.'
    },
    {
      question: 'Làm sao để theo dõi tình hình của con tại BRIGHTWAY?',
      answer: 'Phụ huynh có thể theo dõi tình hình của con thông qua ứng dụng di động BRIGHTWAY. Ứng dụng cung cấp các tính năng: xem lịch học và hoạt động, nhận thông báo về tình hình học tập và sức khỏe, xem ảnh và video hoạt động của con, trao đổi với giáo viên và nhân viên, quản lý tài chính và thanh toán.'
    },
    {
      question: 'BRIGHTWAY có đảm bảo an toàn cho trẻ không?',
      answer: 'An toàn là ưu tiên hàng đầu của BRIGHTWAY. Chúng tôi có: (1) Hệ thống giám sát 24/7, (2) Đội ngũ nhân viên được đào tạo chuyên nghiệp về an toàn và sơ cứu, (3) Cơ sở vật chất đảm bảo tiêu chuẩn an toàn, (4) Quy trình đón trả trẻ nghiêm ngặt, (5) Bảo hiểm cho trẻ trong thời gian tham gia chương trình.'
    },
    {
      question: 'Con tôi có thể tham gia những hoạt động gì?',
      answer: 'BRIGHTWAY cung cấp nhiều hoạt động đa dạng: (1) Hoạt động thể thao: bóng đá, bóng rổ, bơi lội, võ thuật, (2) Hoạt động nghệ thuật: vẽ tranh, làm thủ công, âm nhạc, biểu diễn, (3) Hoạt động học tập: đọc sách, làm bài tập, phát triển tư duy, (4) Hoạt động ngoại khóa: dã ngoại, tham quan, sự kiện đặc biệt.'
    },
    {
      question: 'Làm thế nào để liên hệ với BRIGHTWAY?',
      answer: 'Bạn có thể liên hệ với BRIGHTWAY qua: (1) Điện thoại: Gọi đến số hotline của chúng tôi, (2) Email: Gửi email đến địa chỉ hỗ trợ, (3) Ứng dụng: Sử dụng tính năng chat trong ứng dụng di động, (4) Trực tiếp: Đến cơ sở của chúng tôi trong giờ làm việc. Chúng tôi luôn sẵn sàng hỗ trợ bạn.'
    },
    {
      question: 'Có thể đổi hoặc hủy gói dịch vụ không?',
      answer: 'Có, phụ huynh có thể đổi hoặc hủy gói dịch vụ. Vui lòng liên hệ với bộ phận chăm sóc khách hàng ít nhất 7 ngày trước khi muốn thay đổi. Chúng tôi sẽ hướng dẫn bạn quy trình và xử lý các khoản phí liên quan (nếu có) theo chính sách của BRIGHTWAY.'
    },
    {
      question: 'BRIGHTWAY có hỗ trợ trẻ có nhu cầu đặc biệt không?',
      answer: 'BRIGHTWAY cam kết tạo môi trường hòa nhập cho tất cả trẻ em. Chúng tôi có đội ngũ giáo viên được đào tạo về giáo dục đặc biệt và sẵn sàng hỗ trợ trẻ có nhu cầu đặc biệt. Vui lòng liên hệ trước để chúng tôi có thể chuẩn bị kế hoạch chăm sóc phù hợp nhất cho con bạn.'
    },
    {
      question: 'Làm sao để đặt lịch giữ trẻ?',
      answer: 'Phụ huynh có thể đặt lịch giữ trẻ dễ dàng qua ứng dụng di động BRIGHTWAY: (1) Chọn ngày và giờ muốn đặt, (2) Chọn phòng và hoạt động phù hợp, (3) Xác nhận đặt lịch và thanh toán. Hệ thống sẽ tự động gửi thông báo xác nhận và nhắc nhở trước giờ đón trẻ.'
    }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f8f9fa',
        pt: { xs: 8, md: 12 },
        pb: 8
      }}
    >
      <Container maxWidth="md">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box
            sx={{
              textAlign: 'center',
              mb: 6
            }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: alpha('#1abc9c', 0.1),
                mb: 3
              }}
            >
              <QuestionAnswerIcon
                sx={{
                  fontSize: 40,
                  color: '#1abc9c'
                }}
              />
            </Box>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '2rem', md: '3rem' },
                fontWeight: 800,
                mb: 2,
                background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Câu Hỏi Thường Gặp (FAQs)
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.1rem',
                color: theme.palette.text.secondary,
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.8
              }}
            >
              Tìm câu trả lời cho các thắc mắc phổ biến về dịch vụ và hệ thống BRIGHTWAY
            </Typography>
          </Box>
        </motion.div>

        {/* FAQ Accordion */}
        <Box sx={{ mb: 4 }}>
          {faqData.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Accordion
                expanded={expanded === `panel${index}`}
                onChange={handleChange(`panel${index}`)}
                sx={{
                  mb: 4,
                  borderRadius: '12px !important',
                  boxShadow: 2,
                  '&:before': {
                    display: 'none'
                  },
                  '&.Mui-expanded': {
                    margin: '0 0 32px 0',
                    boxShadow: 4
                  },
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 3
                  }
                }}
              >
                <AccordionSummary
                  expandIcon={
                    <ExpandMoreIcon
                      sx={{
                        color: '#1abc9c',
                        fontSize: 28
                      }}
                    />
                  }
                  sx={{
                    px: 3,
                    py: 2,
                    '&.Mui-expanded': {
                      bgcolor: alpha('#1abc9c', 0.05),
                      borderTopLeftRadius: '12px',
                      borderTopRightRadius: '12px'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    <HelpIcon
                      sx={{
                        color: '#1abc9c',
                        fontSize: 24,
                        flexShrink: 0
                      }}
                    />
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        fontSize: { xs: '1rem', md: '1.1rem' }
                      }}
                    >
                      {faq.question}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    px: 3,
                    py: 3,
                    bgcolor: expanded === `panel${index}` ? alpha('#1abc9c', 0.02) : 'transparent',
                    borderBottomLeftRadius: '12px',
                    borderBottomRightRadius: '12px'
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.8,
                      fontSize: '1rem',
                      pl: 5
                    }}
                  >
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </motion.div>
          ))}
        </Box>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Box
            sx={{
              textAlign: 'center',
              p: 4,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
              color: 'white',
              boxShadow: 4
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 2
              }}
            >
              Vẫn còn thắc mắc?
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mb: 3,
                opacity: 0.95,
                fontSize: '1.1rem'
              }}
            >
              Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giải đáp mọi thắc mắc của bạn
            </Typography>
            <Box
              component="a"
              href="/contact"
              sx={{
                display: 'inline-block',
                px: 4,
                py: 1.5,
                bgcolor: 'white',
                color: '#1abc9c',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 6
                }
              }}
            >
              Liên Hệ Ngay
            </Box>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default FAQ;

