import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap,
  Trophy,
  Users,
  BarChart3,
  Calendar,
  Shield,
  ArrowRight,
  Sparkles,
  Rocket,
  Target,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Landing = () => {
  const features = [
    {
      icon: Calendar,
      title: 'Multi-Round Support',
      description: 'Create complex hackathons with multiple evaluation rounds, each with custom criteria and deadlines.',
    },
    {
      icon: BarChart3,
      title: 'Automated Evaluation',
      description: 'Powerful judging system with weighted criteria, real-time score calculations, and detailed feedback.',
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Easy team formation with invite system, role management, and collaboration tools.',
    },
    {
      icon: Trophy,
      title: 'Real-Time Results',
      description: 'Instant leaderboards, result publishing controls, and comprehensive analytics.',
    },
    {
      icon: Shield,
      title: 'Role-Based Access',
      description: 'Secure dashboards for organizers, judges, and participants with tailored features.',
    },
    {
      icon: Sparkles,
      title: 'Beautiful Submissions',
      description: 'Support for PPTs, videos, GitHub repos, live demos, and more submission types.',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Participants' },
    { value: '500+', label: 'Hackathons' },
    { value: '50K+', label: 'Submissions' },
    { value: '1K+', label: 'Prizes Awarded' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero">
        {/* Background Effects */}
        <div className="absolute inset-0 gradient-glow opacity-50" />
        <div className="absolute inset-0 bg-hero-pattern" />
        
        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
            >
              <Rocket className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">The Future of Hackathon Management</span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight">
              Where{' '}
              <span className="text-gradient">Innovation</span>
              <br />
              Meets Competition
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              The all-in-one platform to organize, judge, and participate in hackathons. 
              Streamline your innovation events with powerful tools built for the modern hacker.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="xl" variant="hero" asChild>
                <Link to="/hackathons">
                  <Zap className="w-5 h-5 mr-2" />
                  Browse Hackathons
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link to="/register">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-heading font-bold text-gradient mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-primary"
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Everything You Need to{' '}
              <span className="text-gradient">Succeed</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From organizing your first hackathon to managing enterprise-level events,
              HackFlow has all the tools you need.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group p-6 rounded-2xl gradient-card border border-border hover:border-primary/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-glow">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-24 gradient-hero">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Built for <span className="text-gradient">Everyone</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you're organizing, judging, or participating, HackFlow has tailored
              experiences for every role.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                role: 'Organizers',
                description: 'Create and manage hackathons with powerful admin tools, round configuration, and real-time analytics.',
                features: ['Multi-round setup', 'Judge management', 'Result publishing', 'Analytics dashboard'],
              },
              {
                icon: Award,
                role: 'Judges',
                description: 'Evaluate submissions with structured criteria, provide detailed feedback, and track your progress.',
                features: ['Criteria-based scoring', 'Submission review', 'Feedback system', 'Progress tracking'],
              },
              {
                icon: Users,
                role: 'Participants',
                description: 'Form teams, submit projects, and track your performance across multiple hackathons.',
                features: ['Team formation', 'Multi-format submissions', 'Result tracking', 'Invitation system'],
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 rounded-2xl glass border border-border hover:border-primary/50 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-6 shadow-glow">
                  <item.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                  For {item.role}
                </h3>
                <p className="text-muted-foreground text-sm mb-6">
                  {item.description}
                </p>
                <ul className="space-y-2">
                  {item.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-glow opacity-30" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">
              Ready to Transform Your{' '}
              <span className="text-gradient">Hackathons</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Join thousands of innovators already using HackFlow to run successful
              hackathons. Get started for free today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="xl" variant="hero" asChild>
                <Link to="/register">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start for Free
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link to="/hackathons">
                  Explore Hackathons
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
