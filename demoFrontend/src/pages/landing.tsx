import { Link } from 'react-router-dom'
import { 
  Shield, 
  Heart, 
  GraduationCap, 
  Users, 
  Home, 
  ArrowRight,
  BarChart3,
  Globe,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
export function LandingPage() {
  const scrollToContent = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section - Full-bleed with background image */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/hero-bg.jpg)' }}
        />
        {/* Dark Overlay with subtle purple tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        
        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 py-24 w-full">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm text-white/90">
              <Shield className="h-4 w-4" />
              <span>Safe Haven Shelter Management</span>
            </div>
            
            {/* Headline - left-aligned, mix of italic and bold like Arc reference */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl text-white leading-[1.08]">
              <span className="font-serif italic font-normal">Your Healing,</span>
              <br />
              <span className="font-serif font-bold">Our Mission</span>
            </h1>
            
            {/* Subheadline */}
            <p className="mt-6 text-lg sm:text-xl leading-relaxed text-white/80 max-w-xl text-pretty">
              We provide holistic care, education, counseling, and a path toward healing 
              for survivors of abuse and trafficking in the Philippines.
            </p>
            
            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
              <Button size="lg" asChild className="bg-white text-black hover:bg-white/90 font-medium">
                <Link to="/impact">
                  See Our Impact
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild 
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white hover:border-white/60"
              >
                <Link to="/login">
                  <Heart className="mr-2 h-4 w-4" />
                  Contribute / Donate
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <button 
          onClick={scrollToContent}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors cursor-pointer"
          aria-label="Scroll to content"
        >
          <span className="text-xs uppercase tracking-widest">Explore</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </button>
      </section>

      {/* Features Section - Clean cards with icons */}
      <section id="features" className="py-24 sm:py-32 bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <p className="text-sm font-medium uppercase tracking-widest text-primary mb-4">What We Provide</p>
            <h2 className="text-3xl font-serif font-semibold tracking-tight text-foreground sm:text-4xl">
              Comprehensive Support
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Every step of the healing journey, we&apos;re there.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={Home}
              title="Safe Shelter"
              description="Secure, nurturing environments across 9 safehouses in Luzon, Visayas, and Mindanao."
            />
            <FeatureCard
              icon={Heart}
              title="Holistic Care"
              description="Comprehensive support including nutrition, health monitoring, and emotional wellbeing."
            />
            <FeatureCard
              icon={GraduationCap}
              title="Education"
              description="Bridge programs, secondary education, vocational training, and literacy support."
            />
            <FeatureCard
              icon={Users}
              title="Reintegration"
              description="Guided pathways back to family, foster care, or independent living."
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Impact Numbers Section */}
      <section className="py-24 sm:py-32 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <p className="text-sm font-medium uppercase tracking-widest text-primary mb-4">Our Results</p>
            <h2 className="text-3xl font-serif font-semibold tracking-tight text-foreground sm:text-4xl">
              Impact in Numbers
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Real results from our dedicated work across the Philippines.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <ImpactMetricCard
              icon={BarChart3}
              value={impactStatistics.reintegrationRate}
              suffix="%"
              label="Reintegration Rate"
              description="Successfully reintegrated into families or independent living"
            />
            <ImpactMetricCard
              icon={Sparkles}
              value={impactStatistics.counselingSessions}
              suffix="+"
              label="Counseling Sessions"
              description="Individual and group therapy sessions conducted"
            />
            <ImpactMetricCard
              icon={Globe}
              value={impactStatistics.regionsServed}
              label="Regions Served"
              description="Coverage across Luzon, Visayas, and Mindanao"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 sm:py-32 bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <p className="text-sm font-medium uppercase tracking-widest text-primary mb-4">Our Process</p>
            <h2 className="text-3xl font-serif font-semibold tracking-tight text-foreground sm:text-4xl">
              The Journey to Healing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A comprehensive approach to supporting survivors.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-4">
            <StepCard
              number="01"
              title="Intake & Assessment"
              description="Each girl receives a thorough assessment to understand her needs and create a personalized care plan."
            />
            <StepCard
              number="02"
              title="Safe Shelter"
              description="Immediate placement in one of our secure safehouses with 24/7 care and supervision."
            />
            <StepCard
              number="03"
              title="Healing & Education"
              description="Comprehensive support including counseling, education, and life skills training."
            />
            <StepCard
              number="04"
              title="Reintegration"
              description="Gradual transition to family reunification, foster care, or independent living."
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Trust Indicators */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-muted-foreground">
            <TrustItem text="501(c)(3) Registered" />
            <TrustItem text="GDPR Compliant" />
            <TrustItem text="Transparent Reporting" />
            <TrustItem text="Annual Audits" />
          </div>
        </div>
      </section>

      <Separator />

      {/* CTA Section - with subtle background */}
      <section className="py-24 sm:py-32 bg-primary/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-serif font-semibold tracking-tight text-foreground sm:text-4xl">
              Join Us in Making a Difference
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Your support helps provide safe shelter, education, and healing for 
              survivors. Every contribution makes a lasting impact.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/impact">
                  Donate Now
                  <Heart className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">
                  Become a Partner
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// Sub-components

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <Card className="border border-border bg-background hover:border-primary/30 hover:shadow-lg transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted/50 group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors">
          <Icon className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}

function ImpactMetricCard({ 
  icon: Icon, 
  value, 
  suffix = '', 
  label, 
  description 
}: { 
  icon: React.ElementType
  value: number
  suffix?: string
  label: string
  description: string 
}) {
  return (
    <Card className="border border-border bg-background">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="text-4xl font-semibold text-foreground font-serif">
            {value.toLocaleString()}{suffix}
          </div>
        </div>
        <h3 className="mt-4 text-base font-medium text-foreground">{label}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="relative group">
      <div className="text-6xl font-semibold text-muted/30 font-serif group-hover:text-primary/20 transition-colors">{number}</div>
      <h3 className="mt-4 text-lg font-medium text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function TrustItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <CheckCircle2 className="h-4 w-4 text-primary" />
      <span>{text}</span>
    </div>
  )
}
