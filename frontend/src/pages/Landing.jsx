import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCounter(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

// ─── Intersection Observer hook ───────────────────────────────────────────────
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
    }, { threshold });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ─── Stats counter section ────────────────────────────────────────────────────
function StatCounter({ value, suffix = '', label }) {
  const [ref, inView] = useInView(0.3);
  const count = useCounter(value, 1800, inView);
  return (
    <div ref={ref} style={styles.statItem}>
      <div style={styles.statNumber}>
        {count}{suffix}
      </div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, color, delay = 0 }) {
  const [ref, inView] = useInView(0.15);
  return (
    <div
      ref={ref}
      style={{
        ...styles.featureCard,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      <div style={{ ...styles.featureIcon, background: `${color}18`, color }}>
        <span className="mi mi-lg">{icon}</span>
      </div>
      <h3 style={styles.featureTitle}>{title}</h3>
      <p style={styles.featureDesc}>{desc}</p>
    </div>
  );
}

// ─── How it works step ────────────────────────────────────────────────────────
function Step({ num, icon, title, desc, delay = 0 }) {
  const [ref, inView] = useInView(0.15);
  return (
    <div
      ref={ref}
      style={{
        ...styles.step,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      <div style={styles.stepNum}>{num}</div>
      <div style={styles.stepIcon}>
        <span className="mi mi-lg">{icon}</span>
      </div>
      <h3 style={styles.stepTitle}>{title}</h3>
      <p style={styles.stepDesc}>{desc}</p>
    </div>
  );
}

// ─── Testimonial card ─────────────────────────────────────────────────────────
function TestimonialCard({ name, role, text, avatar, delay = 0 }) {
  const [ref, inView] = useInView(0.15);
  return (
    <div
      ref={ref}
      style={{
        ...styles.testimonialCard,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      <div style={styles.testimonialStars}>{'★'.repeat(5)}</div>
      <p style={styles.testimonialText}>"{text}"</p>
      <div style={styles.testimonialAuthor}>
        <div style={{ ...styles.testimonialAvatar, background: avatar }}>
          {name[0]}
        </div>
        <div>
          <div style={styles.testimonialName}>{name}</div>
          <div style={styles.testimonialRole}>{role}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function Landing() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    if (user) navigate('/');
    setTimeout(() => setHeroVisible(true), 100);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [user, navigate]);

  const isDark = theme === 'dark';

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: 'Poppins, sans-serif', color: 'var(--text)' }}>

      {/* ── Top Navbar ── */}
      <nav style={{
        ...styles.landingNav,
        background: scrolled ? 'var(--navbar-bg)' : 'transparent',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
      }}>
        <div style={styles.landingNavInner}>
          <div style={styles.navBrand}>
            <span style={styles.navDot} />
            FocusTracker
          </div>
          <div style={styles.navActions}>
            <button onClick={toggleTheme} style={styles.navIconBtn} title="Toggle theme">
              <span className="mi" style={{ fontSize: 20 }}>{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <Link to="/login" style={styles.navLoginBtn}>Sign In</Link>
            <Link to="/register" style={styles.navRegisterBtn}>Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={styles.hero}>
        {/* Background glow orbs */}
        <div style={{ ...styles.glowOrb, top: '10%', left: '10%', background: 'rgba(0,212,255,0.08)', width: 500, height: 500 }} />
        <div style={{ ...styles.glowOrb, bottom: '10%', right: '8%', background: 'rgba(0,230,118,0.06)', width: 400, height: 400 }} />

        <div style={styles.heroInner}>
          <div style={{
            ...styles.heroBadge,
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}>
            <span className="mi mi-sm" style={{ color: 'var(--accent)' }}>bolt</span>
            Designed for Deep Focus
          </div>

          <h1 style={{
            ...styles.heroTitle,
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
          }}>
            Master Your Time.<br />
            <span style={styles.heroTitleAccent}>Track Every Session.</span>
          </h1>

          <p style={{
            ...styles.heroSubtitle,
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s',
          }}>
            FocusTracker helps students, professionals and creators build deep work habits
            by tracking every focus session — with live timers, rich history, and personal insights.
          </p>

          <div style={{
            ...styles.heroCtas,
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s',
          }}>
            <Link to="/register" style={styles.ctaPrimary}>
              <span className="mi mi-sm">rocket_launch</span>
              Start for Free
            </Link>
            <Link to="/login" style={styles.ctaSecondary}>
              <span className="mi mi-sm">login</span>
              Sign In
            </Link>
          </div>

          <p style={{
            ...styles.heroNote,
            opacity: heroVisible ? 1 : 0,
            transition: 'opacity 0.7s ease 0.45s',
          }}>
            Free forever · No credit card required · Takes 30 seconds
          </p>
        </div>

        {/* Hero mockup card */}
        <div style={{
          ...styles.heroMockup,
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'translateY(0) rotate(-1deg)' : 'translateY(40px) rotate(-1deg)',
          transition: 'opacity 0.8s ease 0.4s, transform 0.8s ease 0.4s',
        }}>
          <div style={styles.mockupCard}>
            <div style={styles.mockupHeader}>
              <div style={styles.mockupDots}>
                <span style={{ ...styles.mockupDot, background: '#ff5f57' }} />
                <span style={{ ...styles.mockupDot, background: '#ffbd2e' }} />
                <span style={{ ...styles.mockupDot, background: '#28c840' }} />
              </div>
              <span style={styles.mockupTitle}>Current Session</span>
            </div>
            <div style={styles.mockupTimer}>02:34:18</div>
            <div style={styles.mockupLabel}>
              <span className="mi mi-sm" style={{ color: '#7c6af7' }}>menu_book</span>
              Study · Chapter 5 Chemistry
            </div>
            <div style={styles.mockupProgress}>
              <div style={styles.mockupProgressFill} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <div style={styles.mockupBtn}>
                <span className="mi mi-sm">pause</span> Pause
              </div>
              <div style={{ ...styles.mockupBtn, background: 'var(--green)', color: '#000', flex: 1 }}>
                <span className="mi mi-sm">check_circle</span> Complete
              </div>
            </div>
          </div>

          {/* Floating stat pills */}
          <div style={{ ...styles.floatPill, top: -16, right: -16, animationDelay: '0s' }}>
            <span className="mi mi-sm" style={{ color: 'var(--green)' }}>trending_up</span>
            +2h today
          </div>
          <div style={{ ...styles.floatPill, bottom: 24, left: -24, animationDelay: '0.8s' }}>
            <span className="mi mi-sm" style={{ color: 'var(--yellow)' }}>local_fire_department</span>
            7-day streak
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={styles.statsSection}>
        <div style={styles.statsGrid}>
          <StatCounter value={10000} suffix="+" label="Sessions Tracked" />
          <StatCounter value={500}   suffix="+"  label="Active Users" />
          <StatCounter value={98}    suffix="%"  label="Satisfaction Rate" />
          <StatCounter value={2500}  suffix="h+" label="Hours Focused" />
        </div>
      </section>

      {/* ── Features ── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionBadge}>
            <span className="mi mi-sm" style={{ color: 'var(--accent)' }}>auto_awesome</span>
            Features
          </div>
          <h2 style={styles.sectionTitle}>Everything you need to stay focused</h2>
          <p style={styles.sectionSubtitle}>
            Built for students, developers, writers — anyone who wants to own their time.
          </p>

          <div style={styles.featuresGrid}>
            <FeatureCard delay={0}   icon="timer"           color="var(--accent)"  title="Live Session Timer"       desc="Start a focus session in one click. Watch your time grow in real-time with a beautiful animated ring timer." />
            <FeatureCard delay={80}  icon="pause_circle"    color="var(--yellow)"  title="Pause & Resume"           desc="Life happens. Pause your session anytime and resume exactly where you left off — paused time is excluded automatically." />
            <FeatureCard delay={160} icon="history"         color="var(--green)"   title="Full Session History"     desc="Every session is saved forever. Filter by category, date, or status. See exactly how you spend your focus time." />
            <FeatureCard delay={0}   icon="insights"        color="#c084fc"        title="Personal Analytics"       desc="Dashboard with today's focus, weekly totals, category breakdown, and a 7-day bar chart — all calculated automatically." />
            <FeatureCard delay={80}  icon="category"        color="var(--orange)"  title="Smart Categories"         desc="Organize sessions by Study, Work, Coding, Reading, Exercise, Meditation and more. Know exactly where your time goes." />
            <FeatureCard delay={160} icon="lock"            color="#7c6af7"        title="Private & Secure"         desc="Your sessions are private. JWT authentication ensures only you can see your own data — nobody else's sessions are visible." />
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ ...styles.section, background: 'var(--bg2)' }}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionBadge}>
            <span className="mi mi-sm" style={{ color: 'var(--green)' }}>map</span>
            How It Works
          </div>
          <h2 style={styles.sectionTitle}>Up and running in 60 seconds</h2>
          <p style={styles.sectionSubtitle}>No complex setup. No learning curve. Just focus.</p>

          <div style={styles.stepsGrid}>
            <Step delay={0}   num="01" icon="person_add"   title="Create your account"     desc="Sign up with your name and email. Free forever, no credit card needed." />
            <Step delay={100} num="02" icon="add_circle"   title="Start a session"         desc="Give it a title, pick a category, add optional notes and hit Start." />
            <Step delay={200} num="03" icon="timer"        title="Focus & track"            desc="The live timer runs in the background. Pause when you need a break." />
            <Step delay={300} num="04" icon="check_circle" title="Complete & review"        desc="Mark it done to save the session. Review your stats on the dashboard." />
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <div style={styles.benefitsGrid}>
            <div style={styles.benefitsText}>
              <div style={styles.sectionBadge}>
                <span className="mi mi-sm" style={{ color: 'var(--orange)' }}>psychology</span>
                Why It Works
              </div>
              <h2 style={{ ...styles.sectionTitle, textAlign: 'left', margin: '12px 0' }}>
                Build the habit of deep work
              </h2>
              <p style={{ color: 'var(--text2)', fontSize: '0.95rem', lineHeight: 1.8, marginBottom: 28 }}>
                Research shows that tracking your work time dramatically improves focus and productivity.
                When you can see exactly how many hours you've put in, you're more motivated to keep going.
              </p>
              {[
                { icon: 'visibility',       text: 'See where your time actually goes' },
                { icon: 'trending_up',      text: 'Watch your focus streaks grow over time' },
                { icon: 'self_improvement', text: 'Build consistent deep work habits' },
                { icon: 'emoji_events',     text: 'Feel accomplished after every session' },
              ].map(({ icon, text }) => (
                <div key={text} style={styles.benefitItem}>
                  <span className="mi mi-sm" style={{ color: 'var(--accent)', flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: '0.92rem', color: 'var(--text2)' }}>{text}</span>
                </div>
              ))}
              <Link to="/register" style={{ ...styles.ctaPrimary, display: 'inline-flex', marginTop: 32 }}>
                <span className="mi mi-sm">rocket_launch</span>
                Get Started Free
              </Link>
            </div>
            <div style={styles.benefitsVisual}>
              {/* Mini dashboard mockup */}
              <div style={styles.miniDash}>
                <div style={styles.miniDashTitle}>
                  <span className="mi mi-sm" style={{ color: 'var(--accent)' }}>dashboard</span>
                  Your Dashboard
                </div>
                {[
                  { label: "Today's Focus", value: '3h 42m', color: 'var(--green)', icon: 'today' },
                  { label: 'This Week',     value: '18h 05m', color: 'var(--accent)', icon: 'date_range' },
                  { label: 'Total Sessions', value: '47',     color: 'var(--yellow)', icon: 'check_circle' },
                  { label: 'Avg Session',   value: '52m',     color: 'var(--orange)', icon: 'bolt' },
                ].map(({ label, value, color, icon }) => (
                  <div key={label} style={{ ...styles.miniStatCard, '--stat-color': color }}>
                    <span className="mi mi-sm" style={{ color }}>{icon}</span>
                    <div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>{value}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ ...styles.section, background: 'var(--bg2)' }}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionBadge}>
            <span className="mi mi-sm" style={{ color: '#c084fc' }}>format_quote</span>
            Testimonials
          </div>
          <h2 style={styles.sectionTitle}>Loved by focused people</h2>

          <div style={styles.testimonialsGrid}>
            <TestimonialCard delay={0}
              name="Nitin Parmar" role="Medical Student"
              avatar="linear-gradient(135deg,#7c6af7,#c084fc)"
              text="I used to lose track of how long I studied. Now I can see exactly where every hour goes. My exam scores improved by 20% in one semester." />
            <TestimonialCard delay={100}
              name="Kirtan Patel" role="Frontend Developer"
              avatar="linear-gradient(135deg,#00d4ff,#00e676)"
              text="The pause feature is a lifesaver. I can take breaks without guilt knowing my actual focus time is being tracked separately. Brilliant app." />
            <TestimonialCard delay={200}
              name="Mohit Parmar" role="Content Creator"
              avatar="linear-gradient(135deg,#ff6b35,#ffd23f)"
              text="I love seeing the 7-day chart fill up. It motivates me to keep going every day. Simple, clean, and it actually works." />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaGlow} />
        <div style={styles.ctaInner}>
          <h2 style={styles.ctaTitle}>Ready to take control of your time?</h2>
          <p style={styles.ctaSubtitle}>
            Join thousands of focused people. Free forever. Start in 30 seconds.
          </p>
          <Link to="/register" style={{ ...styles.ctaPrimary, fontSize: '1rem', padding: '16px 40px' }}>
            <span className="mi">rocket_launch</span>
            Create Your Free Account
          </Link>
          <p style={{ marginTop: 16, color: 'var(--text3)', fontSize: '0.82rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerBrand}>
            <span style={{ ...styles.navDot, width: 8, height: 8 }} />
            FocusTracker
          </div>
          <p style={styles.footerText}>
            Built with focus, for the focused.
          </p>
          <div style={styles.footerLinks}>
            <Link to="/register" style={styles.footerLink}>Get Started</Link>
            <Link to="/login" style={styles.footerLink}>Sign In</Link>
          </div>
        </div>
      </footer>

      {/* Floating animation styles */}
      <style>{`
        @keyframes floatY {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  // Navbar
  landingNav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
    transition: 'all 0.3s ease',
  },
  landingNavInner: {
    maxWidth: 1100, margin: '0 auto', padding: '0 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: 64,
  },
  navBrand: {
    display: 'flex', alignItems: 'center', gap: 10,
    fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)',
  },
  navDot: {
    display: 'inline-block', width: 10, height: 10,
    borderRadius: '50%', background: 'var(--accent)',
    boxShadow: '0 0 12px var(--accent)',
    animation: 'floatY 2s ease-in-out infinite',
  },
  navActions: { display: 'flex', alignItems: 'center', gap: 10 },
  navIconBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 38, height: 38, borderRadius: 9,
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text2)', cursor: 'pointer', fontFamily: 'Material Icons Round',
    transition: 'all 0.2s',
  },
  navLoginBtn: {
    padding: '8px 18px', borderRadius: 9,
    border: '1px solid var(--border)',
    background: 'transparent', color: 'var(--text2)',
    textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
    transition: 'all 0.2s',
  },
  navRegisterBtn: {
    padding: '8px 18px', borderRadius: 9,
    background: 'var(--accent)', color: '#000',
    textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 6,
    transition: 'all 0.2s',
  },

  // Hero
  hero: {
    minHeight: '100vh',
    display: 'flex', alignItems: 'center',
    padding: '100px 24px 80px',
    maxWidth: 1100, margin: '0 auto',
    gap: 48, flexWrap: 'wrap',
    position: 'relative',
  },
  glowOrb: {
    position: 'fixed', borderRadius: '50%',
    filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0,
  },
  heroInner: { flex: '1 1 480px', position: 'relative', zIndex: 1 },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '6px 16px', borderRadius: 99,
    border: '1px solid var(--border)',
    background: 'var(--card)',
    fontSize: '0.82rem', fontWeight: 600, color: 'var(--text2)',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
    fontWeight: 800, lineHeight: 1.15,
    letterSpacing: '-0.03em', color: 'var(--text)',
    marginBottom: 20,
  },
  heroTitleAccent: {
    background: 'linear-gradient(135deg, var(--accent), var(--green))',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSubtitle: {
    fontSize: '1.05rem', color: 'var(--text2)',
    lineHeight: 1.75, maxWidth: 520, marginBottom: 36,
  },
  heroCtas: { display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 },
  heroNote: {
    fontSize: '0.8rem', color: 'var(--text3)',
    display: 'flex', alignItems: 'center', gap: 8,
  },

  // CTA Buttons
  ctaPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '13px 28px', borderRadius: 10,
    background: 'var(--accent)', color: '#000',
    fontFamily: 'Poppins, sans-serif', fontWeight: 700,
    fontSize: '0.9rem', textDecoration: 'none',
    transition: 'all 0.2s', cursor: 'pointer', border: 'none',
    boxShadow: '0 4px 20px var(--accent-glow)',
  },
  ctaSecondary: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '13px 28px', borderRadius: 10,
    border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text)', fontFamily: 'Poppins, sans-serif',
    fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
    transition: 'all 0.2s',
  },

  // Hero Mockup
  heroMockup: {
    flex: '1 1 320px', display: 'flex', justifyContent: 'center',
    position: 'relative', zIndex: 1,
  },
  mockupCard: {
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 18, padding: 28, width: 320,
    boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
  },
  mockupHeader: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
  },
  mockupDots: { display: 'flex', gap: 6 },
  mockupDot: { width: 10, height: 10, borderRadius: '50%' },
  mockupTitle: { fontSize: '0.82rem', color: 'var(--text2)', fontWeight: 600, marginLeft: 4 },
  mockupTimer: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '3rem', fontWeight: 300,
    color: 'var(--text)', textAlign: 'center',
    letterSpacing: '-0.02em', marginBottom: 12,
  },
  mockupLabel: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: '0.82rem', color: 'var(--text2)',
    justifyContent: 'center', marginBottom: 16,
  },
  mockupProgress: {
    height: 4, background: 'var(--border)',
    borderRadius: 2, overflow: 'hidden',
  },
  mockupProgressFill: {
    height: '100%', width: '65%',
    background: 'linear-gradient(90deg, var(--accent), var(--green))',
    borderRadius: 2, animation: 'none',
  },
  mockupBtn: {
    flex: 1, padding: '10px 14px', borderRadius: 9,
    background: 'var(--bg2)', border: '1px solid var(--border)',
    color: 'var(--text2)', fontSize: '0.82rem', fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    cursor: 'default',
  },
  floatPill: {
    position: 'absolute',
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'var(--card2)', border: '1px solid var(--border)',
    borderRadius: 99, padding: '6px 14px',
    fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    animation: 'floatY 3s ease-in-out infinite',
    whiteSpace: 'nowrap',
  },

  // Stats
  statsSection: {
    borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
    padding: '48px 24px', background: 'var(--bg2)',
  },
  statsGrid: {
    maxWidth: 900, margin: '0 auto',
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 32,
  },
  statItem: { textAlign: 'center' },
  statNumber: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '2.5rem', fontWeight: 700,
    background: 'linear-gradient(135deg, var(--accent), var(--green))',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  statLabel: { color: 'var(--text2)', fontSize: '0.85rem', marginTop: 6, fontWeight: 500 },

  // Sections
  section: { padding: '96px 24px' },
  sectionInner: { maxWidth: 1100, margin: '0 auto' },
  sectionBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '5px 14px', borderRadius: 99,
    border: '1px solid var(--border)', background: 'var(--card)',
    fontSize: '0.8rem', fontWeight: 600, color: 'var(--text2)',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
    fontWeight: 700, letterSpacing: '-0.02em',
    color: 'var(--text)', textAlign: 'center',
    marginBottom: 14, maxWidth: 640, margin: '0 auto 14px',
  },
  sectionSubtitle: {
    color: 'var(--text2)', fontSize: '1rem',
    textAlign: 'center', maxWidth: 520,
    margin: '0 auto 64px', lineHeight: 1.7,
  },

  // Features
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 20, marginTop: 64,
  },
  featureCard: {
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 16, padding: '28px 24px',
    transition: 'border-color 0.2s',
  },
  featureIcon: {
    width: 48, height: 48, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
  },
  featureTitle: { fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: 10 },
  featureDesc: { color: 'var(--text2)', fontSize: '0.875rem', lineHeight: 1.7 },

  // Steps
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 32, marginTop: 64,
  },
  step: { textAlign: 'center', padding: '0 16px' },
  stepNum: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.78rem', fontWeight: 700,
    color: 'var(--accent)', letterSpacing: '0.1em',
    marginBottom: 16,
  },
  stepIcon: {
    width: 64, height: 64, borderRadius: '50%',
    background: 'var(--accent-glow2)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 20px', color: 'var(--accent)',
  },
  stepTitle: { fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: 10 },
  stepDesc: { color: 'var(--text2)', fontSize: '0.875rem', lineHeight: 1.7 },

  // Benefits
  benefitsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 64, alignItems: 'center',
  },
  benefitsText: {},
  benefitItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    marginBottom: 14,
  },
  benefitsVisual: {},
  miniDash: {
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 16, padding: 24,
    boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
  },
  miniDashTitle: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)',
    marginBottom: 20, paddingBottom: 16,
    borderBottom: '1px solid var(--border)',
  },
  miniStatCard: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 16px', borderRadius: 10,
    background: 'var(--bg2)', border: '1px solid var(--border)',
    marginBottom: 10, position: 'relative', overflow: 'hidden',
  },

  // Testimonials
  testimonialsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 20, marginTop: 48,
  },
  testimonialCard: {
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 16, padding: '28px 24px',
  },
  testimonialStars: { color: '#ffd23f', fontSize: '1rem', marginBottom: 14, letterSpacing: 2 },
  testimonialText: { color: 'var(--text2)', fontSize: '0.9rem', lineHeight: 1.75, marginBottom: 20 },
  testimonialAuthor: { display: 'flex', alignItems: 'center', gap: 12 },
  testimonialAvatar: {
    width: 40, height: 40, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '1rem', color: '#fff', flexShrink: 0,
  },
  testimonialName: { fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' },
  testimonialRole: { fontSize: '0.78rem', color: 'var(--text3)', marginTop: 2 },

  // CTA Section
  ctaSection: {
    padding: '96px 24px', textAlign: 'center',
    position: 'relative', overflow: 'hidden',
    borderTop: '1px solid var(--border)',
  },
  ctaGlow: {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600, height: 300,
    background: 'radial-gradient(ellipse, rgba(0,212,255,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  ctaInner: { position: 'relative', zIndex: 1 },
  ctaTitle: {
    fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
    fontWeight: 800, letterSpacing: '-0.02em',
    color: 'var(--text)', marginBottom: 16,
  },
  ctaSubtitle: {
    color: 'var(--text2)', fontSize: '1rem',
    maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.7,
  },

  // Footer
  footer: {
    borderTop: '1px solid var(--border)',
    padding: '32px 24px',
    background: 'var(--bg2)',
  },
  footerInner: {
    maxWidth: 1100, margin: '0 auto',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
  },
  footerBrand: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)',
  },
  footerText: { color: 'var(--text3)', fontSize: '0.82rem' },
  footerLinks: { display: 'flex', gap: 20 },
  footerLink: {
    color: 'var(--text2)', textDecoration: 'none',
    fontSize: '0.82rem', fontWeight: 500,
    transition: 'color 0.2s',
  },
};
