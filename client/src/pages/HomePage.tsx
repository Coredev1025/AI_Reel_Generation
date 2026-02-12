import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Chip,
  Avatar,
  Paper,
  Fade,
  Zoom,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Upload,
  AutoAwesome,
  ArrowForward,
  PlayCircleOutline,
  Star,
  CheckCircle,
  Tune,
  MovieCreation,
  Brush,
  ExpandMore,
  CameraAlt,
  Business,
  Groups,
  MusicNote,
  Subtitles,
  SmartDisplay,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../constants/theme';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expandedFaq, setExpandedFaq] = useState<string | false>(false);

  const handleStartBuilding = () => {
    navigate('/dashboard');
  };

  const steps = [
    {
      step: 1,
      icon: <Upload sx={{ fontSize: 28 }} />,
      title: 'Upload your photos',
      description:
        'Upload photos from your computer or import them from listing platforms with just one click.',
    },
    {
      step: 2,
      icon: <Tune sx={{ fontSize: 28 }} />,
      title: 'Customize the look and feel',
      description:
        'Choose orientation, captions, music, and brand elements to match your style and audience.',
    },
    {
      step: 3,
      icon: <MovieCreation sx={{ fontSize: 28 }} />,
      title: 'Get your polished video instantly',
      description:
        'AI-powered editing transforms your photos into ready-to-post videos in minutes.',
    },
    {
      step: 4,
      icon: <Brush sx={{ fontSize: 28 }} />,
      title: 'Add your own style',
      description:
        'Add logos, text, and personal branding to create a masterpiece that stands out.',
    },
  ];

  const stats = [
    { value: '85,000+', label: 'Videos created' },
    { value: '10 mins', label: 'To create a video' },
    { value: '+403%', label: 'More listings inquiries' },
  ];

  const audiences = [
    {
      icon: <Business sx={{ fontSize: 40 }} />,
      title: 'Realtors & Brokers',
      description:
        'Attract leads, close faster, and win more listings with engaging property videos.',
    },
    {
      icon: <CameraAlt sx={{ fontSize: 40 }} />,
      title: 'Photographers',
      description: 'Upsell AI videos with every order. More profit, no effort.',
    },
    {
      icon: <Groups sx={{ fontSize: 40 }} />,
      title: 'Real Estate Media Companies',
      description:
        'Scale your business and stay competitive with AI property videos — no extra overhead.',
    },
  ];

  const features = [
    {
      icon: <SmartDisplay sx={{ fontSize: 32 }} />,
      title: 'Image to Video',
      description:
        'Convert still images into captivating video tours that highlight key features and create immersive experiences.',
    },
    {
      icon: <AutoAwesome sx={{ fontSize: 32 }} />,
      title: 'AI Photo Enhancement',
      description:
        'Make your listing photos stand out with AI-powered enhancements like twilights, lawn repairs, and more.',
    },
    {
      icon: <MusicNote sx={{ fontSize: 32 }} />,
      title: 'Background Music',
      description:
        'Add the perfect soundtrack to your property videos with our curated music library.',
    },
    {
      icon: <Subtitles sx={{ fontSize: 32 }} />,
      title: 'Social Media Captions',
      description:
        'Automatically create captions optimized for Instagram, Facebook, LinkedIn, YouTube, and X.',
    },
    {
      icon: <Brush sx={{ fontSize: 32 }} />,
      title: 'Custom Branding',
      description:
        'Add your logos, watermarks, and brand colors to every video for consistent professional presence.',
    },
    {
      icon: <Tune sx={{ fontSize: 32 }} />,
      title: 'Video Studio',
      description:
        'Built-in editor to customize videos with templates, music, captions, and your own clips.',
    },
  ];

  const testimonials = [
    {
      name: 'Chris Lawrence',
      title: 'Owner, Rip City Photography, LLC',
      content:
        'It literally takes 5 minutes on the backend to produce a great product to offer to your real estate agents. The cost is affordable and the developers are quick to respond.',
      rating: 5,
    },
    {
      name: 'Kerry Riordan',
      title: 'Owner, Blu Lemonade Photography',
      content:
        'The future is here! ReelBuilder surpasses the rest in terms of quality and accuracy. The generations look authentic with clean movements and tasteful add-ons.',
      rating: 5,
    },
    {
      name: 'Nicole Causey',
      title: 'Co-Founder, Everhome Realty',
      content:
        "ReelBuilder transforms photos into beautiful, realistic video walkthroughs. The Drone 'flyovers' are truly incredible! A must-have tool for realtors in a digital-first world.",
      rating: 5,
    },
  ];

  const faqs = [
    {
      q: 'How long does video processing take?',
      a: 'Videos are typically ready within 10-15 minutes. During peak times, processing may take slightly longer.',
    },
    {
      q: 'Does ReelBuilder support portrait mode?',
      a: 'Yes, you can select portrait mode for videos. For best results, use portrait images for portrait videos and landscape images for landscape videos.',
    },
    {
      q: 'How many images can I use per video?',
      a: 'You can use up to 20 images per video depending on your plan. Each image is converted into a 3-5 second clip.',
    },
    {
      q: 'Can I use my own images?',
      a: 'Absolutely! Upload your own images to create personalized property videos.',
    },
    {
      q: 'Is there a free trial?',
      a: 'Yes, you can sign up and create videos for free. No credit card required to get started.',
    },
    {
      q: 'How do I add background music?',
      a: 'Upload your own music file or choose from our library. The music will automatically be added to your video with fade-in and fade-out effects.',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: COLORS.LIGHT_BG }}>
      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <Box
        sx={{
          background: GRADIENTS.HERO,
          color: 'white',
          pt: { xs: 10, md: 16 },
          pb: { xs: 10, md: 14 },
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decorations */}
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(108, 92, 231, 0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '10%',
            right: '15%',
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 210, 255, 0.1) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Fade in timeout={600}>
            <Box>
              <Chip
                label="#1 REAL ESTATE AI VIDEO PLATFORM"
                sx={{
                  mb: 4,
                  bgcolor: 'rgba(108, 92, 231, 0.2)',
                  color: COLORS.PRIMARY_LIGHT,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  border: '1px solid rgba(108, 92, 231, 0.3)',
                  py: 0.5,
                  px: 1,
                }}
              />

              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontWeight: 800,
                  mb: 3,
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  maxWidth: 900,
                  mx: 'auto',
                }}
              >
                Create Stunning Property Videos
                <Box
                  component="span"
                  sx={{
                    display: 'block',
                    background: GRADIENTS.HERO_ACCENT,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 900,
                  }}
                >
                  Instantly with AI
                </Box>
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  mb: 5,
                  maxWidth: 650,
                  mx: 'auto',
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 400,
                  lineHeight: 1.6,
                }}
              >
                Create videos 100x faster from just photos. Join the top real estate media
                professionals and agents.
              </Typography>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="center"
                sx={{ mb: 3 }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleStartBuilding}
                  endIcon={<ArrowForward />}
                  sx={{
                    px: 5,
                    py: 1.8,
                    fontSize: '1rem',
                    borderRadius: RADIUS.LG,
                    background: GRADIENTS.PRIMARY,
                    fontWeight: 700,
                    boxShadow: SHADOWS.BUTTON,
                    textTransform: 'none',
                    '&:hover': {
                      background: GRADIENTS.PRIMARY_HOVER,
                      transform: 'translateY(-2px)',
                      boxShadow: SHADOWS.BUTTON_HOVER,
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Start for free
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<PlayCircleOutline />}
                  sx={{
                    px: 5,
                    py: 1.8,
                    fontSize: '1rem',
                    borderRadius: RADIUS.LG,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                >
                  Watch demo
                </Button>
              </Stack>

              <Typography
                variant="body2"
                sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 2 }}
              >
                No credit card required
              </Typography>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* ═══════════════ STATS BAR ═══════════════ */}
      <Box sx={{ bgcolor: 'white', py: 6, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center" alignItems="center">
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={4} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      color: COLORS.PRIMARY,
                      mb: 0.5,
                      fontSize: { xs: '2rem', md: '2.5rem' },
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: 'text.secondary', fontWeight: 500 }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ═══════════════ ALL-IN-ONE SECTION ═══════════════ */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Fade in timeout={800}>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Chip
                label="BUILT FOR REAL ESTATE"
                sx={{
                  mb: 3,
                  bgcolor: `${COLORS.PRIMARY}14`,
                  color: COLORS.PRIMARY,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.1em',
                }}
              />
              <Typography
                variant="h3"
                component="h2"
                sx={{
                  fontWeight: 800,
                  mb: 3,
                  fontSize: { xs: '2rem', md: '2.75rem' },
                  letterSpacing: '-0.02em',
                  color: 'text.primary',
                }}
              >
                Your All-in-One{' '}
                <Box component="span" sx={{ color: COLORS.PRIMARY }}>
                  Solution
                </Box>{' '}
                for Property Videos
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{
                  maxWidth: 750,
                  mx: 'auto',
                  lineHeight: 1.7,
                  fontWeight: 400,
                  fontSize: { xs: '1rem', md: '1.15rem' },
                }}
              >
                Turn your property photos into engaging cinematic portrait or landscape videos
                in minutes. Whether you're a real estate media company or an agent, ReelBuilder
                helps you create professional videos seamlessly.
              </Typography>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <Box sx={{ py: { xs: 8, md: 12 }, background: GRADIENTS.PAGE_BG }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip
              label="4 STEPS TO RESULTS"
              sx={{
                mb: 3,
                bgcolor: `${COLORS.PRIMARY}14`,
                color: COLORS.PRIMARY,
                fontWeight: 700,
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
              }}
            />
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: 800,
                mb: 2,
                fontSize: { xs: '2rem', md: '2.75rem' },
                letterSpacing: '-0.02em',
              }}
            >
              Create scroll-stopping reels in{' '}
              <Box component="span" sx={{ color: COLORS.PRIMARY }}>
                minutes
              </Box>
              , not days
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 600, mx: 'auto', fontSize: '1.1rem' }}
            >
              Upload photos, choose your look, and let ReelBuilder's AI handle the editing.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {steps.map((item, index) => (
              <Grid item xs={12} sm={6} md={3} key={item.step}>
                <Fade in timeout={800 + index * 200}>
                  <Card
                    sx={{
                      height: '100%',
                      p: 3,
                      borderRadius: RADIUS.LG,
                      boxShadow: SHADOWS.CARD,
                      border: '1px solid rgba(0,0,0,0.04)',
                      bgcolor: 'white',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-6px)',
                        boxShadow: SHADOWS.CARD_HOVER,
                        borderColor: `${COLORS.PRIMARY}30`,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          mb: 3,
                        }}
                      >
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: RADIUS.SM,
                            background: GRADIENTS.PRIMARY,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            flexShrink: 0,
                          }}
                        >
                          {item.step}
                        </Box>
                        <Box
                          sx={{
                            color: COLORS.PRIMARY,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {item.icon}
                        </Box>
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mb: 1.5, fontSize: '1.05rem' }}
                      >
                        {item.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ lineHeight: 1.7 }}
                      >
                        {item.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ═══════════════ WHO IT'S FOR ═══════════════ */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip
              label="WHO IT'S FOR"
              sx={{
                mb: 3,
                bgcolor: `${COLORS.PRIMARY}14`,
                color: COLORS.PRIMARY,
                fontWeight: 700,
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
              }}
            />
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: 800,
                mb: 2,
                fontSize: { xs: '2rem', md: '2.75rem' },
                letterSpacing: '-0.02em',
              }}
            >
              Tailored for real estate and visual{' '}
              <Box component="span" sx={{ color: COLORS.PRIMARY }}>
                storytelling
              </Box>{' '}
              professionals
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {audiences.map((item, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: 4,
                    borderRadius: RADIUS.LG,
                    boxShadow: SHADOWS.CARD,
                    border: '1px solid rgba(0,0,0,0.04)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: SHADOWS.CARD_HOVER,
                    },
                  }}
                >
                  <CardContent sx={{ p: 0 }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: RADIUS.LG,
                        background: `${COLORS.PRIMARY}10`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3,
                        color: COLORS.PRIMARY,
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                      {item.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ lineHeight: 1.7 }}
                    >
                      {item.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <Box sx={{ py: { xs: 8, md: 12 }, background: GRADIENTS.PAGE_BG }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip
              label="ADDITIONAL FEATURES"
              sx={{
                mb: 3,
                bgcolor: `${COLORS.PRIMARY}14`,
                color: COLORS.PRIMARY,
                fontWeight: 700,
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
              }}
            />
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: 800,
                mb: 2,
                fontSize: { xs: '2rem', md: '2.75rem' },
                letterSpacing: '-0.02em',
              }}
            >
              Go beyond basic editing with{' '}
              <Box component="span" sx={{ color: COLORS.PRIMARY }}>
                powerful
              </Box>{' '}
              add-on tools
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    p: 3,
                    borderRadius: RADIUS.LG,
                    boxShadow: SHADOWS.CARD,
                    border: '1px solid rgba(0,0,0,0.04)',
                    bgcolor: 'white',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: SHADOWS.CARD_HOVER,
                    },
                  }}
                >
                  <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: RADIUS.MD,
                        background: GRADIENTS.PRIMARY,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        mb: 2,
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, mb: 1, fontSize: '1.05rem' }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.7 }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip
              label="TESTIMONIALS"
              sx={{
                mb: 3,
                bgcolor: `${COLORS.PRIMARY}14`,
                color: COLORS.PRIMARY,
                fontWeight: 700,
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
              }}
            />
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: 800,
                mb: 2,
                fontSize: { xs: '2rem', md: '2.75rem' },
                letterSpacing: '-0.02em',
              }}
            >
              What our users are saying
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 700, mx: 'auto', fontSize: '1.1rem' }}
            >
              Real estate media businesses, photographers, and agents are using ReelBuilder
              every day to boost their video marketing.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    p: 0,
                    borderRadius: RADIUS.LG,
                    boxShadow: SHADOWS.CARD,
                    border: '1px solid rgba(0,0,0,0.04)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: SHADOWS.CARD_HOVER,
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} sx={{ color: '#FFB800', fontSize: 20 }} />
                      ))}
                    </Box>
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 4,
                        fontStyle: 'italic',
                        lineHeight: 1.7,
                        fontSize: '0.95rem',
                        color: 'text.secondary',
                      }}
                    >
                      &ldquo;{testimonial.content}&rdquo;
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        sx={{
                          mr: 2,
                          background: GRADIENTS.PRIMARY,
                          width: 48,
                          height: 48,
                          fontSize: '1.1rem',
                          fontWeight: 700,
                        }}
                      >
                        {testimonial.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 700, lineHeight: 1.3 }}
                        >
                          {testimonial.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: '0.8rem' }}
                        >
                          {testimonial.title}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ═══════════════ FAQ ═══════════════ */}
      <Box sx={{ py: { xs: 8, md: 12 }, background: GRADIENTS.PAGE_BG }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip
              label="FAQ"
              sx={{
                mb: 3,
                bgcolor: `${COLORS.PRIMARY}14`,
                color: COLORS.PRIMARY,
                fontWeight: 700,
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
              }}
            />
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: 800,
                mb: 2,
                fontSize: { xs: '2rem', md: '2.75rem' },
                letterSpacing: '-0.02em',
              }}
            >
              Got questions? We've got{' '}
              <Box component="span" sx={{ color: COLORS.PRIMARY }}>
                answers
              </Box>
            </Typography>
          </Box>

          <Box>
            {faqs.map((faq, index) => (
              <Accordion
                key={index}
                expanded={expandedFaq === `faq-${index}`}
                onChange={(_, isExpanded) =>
                  setExpandedFaq(isExpanded ? `faq-${index}` : false)
                }
                elevation={0}
                sx={{
                  mb: 1.5,
                  borderRadius: `${RADIUS.MD}px !important`,
                  border: '1px solid rgba(0,0,0,0.06)',
                  bgcolor: 'white',
                  '&:before': { display: 'none' },
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    py: 1,
                    px: 3,
                    '& .MuiAccordionSummary-content': { my: 2 },
                  }}
                >
                  <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    {faq.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3 }}>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ lineHeight: 1.7 }}
                  >
                    {faq.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ═══════════════ BOTTOM CTA ═══════════════ */}
      <Box
        sx={{
          background: GRADIENTS.HERO,
          color: 'white',
          py: { xs: 8, md: 10 },
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(108, 92, 231, 0.2) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: '2rem', md: '2.75rem' },
              letterSpacing: '-0.02em',
            }}
          >
            Create your AI property videos today
          </Typography>
          <Typography
            variant="h6"
            sx={{
              mb: 5,
              opacity: 0.7,
              fontWeight: 400,
              maxWidth: 600,
              mx: 'auto',
              fontSize: { xs: '1rem', md: '1.15rem' },
            }}
          >
            ReelBuilder helps creators, marketers, and real estate pros turn raw content into
            polished, platform-ready reels in minutes.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleStartBuilding}
            endIcon={<ArrowForward />}
            sx={{
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              borderRadius: RADIUS.LG,
              background: GRADIENTS.PRIMARY,
              fontWeight: 700,
              boxShadow: SHADOWS.BUTTON,
              textTransform: 'none',
              '&:hover': {
                background: GRADIENTS.PRIMARY_HOVER,
                transform: 'translateY(-2px)',
                boxShadow: SHADOWS.BUTTON_HOVER,
              },
              transition: 'all 0.3s ease',
            }}
          >
            Get Started Today
          </Button>
        </Container>
      </Box>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <Box
        sx={{
          bgcolor: COLORS.DARK,
          color: 'rgba(255, 255, 255, 0.5)',
          py: 4,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            &copy; {new Date().getFullYear()} ReelBuilder Inc. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
