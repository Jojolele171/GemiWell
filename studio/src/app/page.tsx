import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LogoIcon } from '@/components/logo-icon';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight, Bot, FileText, HeartPulse, Stethoscope, ChevronRight } from 'lucide-react';

const features = [
  {
    icon: <Bot className="size-8" />,
    title: 'AI Health Chat',
    description: 'Get personalized health advice on diet, lifestyle, and exercise from our friendly AI assistant.',
  },
  {
    icon: <FileText className="size-8" />,
    title: 'Report Summarization',
    description: 'Effortlessly summarize your medical reports with AI and understand key insights at a glance.',
  },
  {
    icon: <HeartPulse className="size-8" />,
    title: 'Health Tracking',
    description: 'Monitor your diet, calories, and daily habits like sleep, steps, and water intake.',
  },
  {
    icon: <Stethoscope className="size-8" />,
    title: 'Doctor Collaboration',
    description: 'Share AI insights with your doctor and compare their reasoning with AI-driven analysis.',
  },
];

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'landing-hero');

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-headline text-lg font-bold">
            <LogoIcon className="size-10" />
            <span className="font-bold text-2xl">GemiWell</span>
          </Link>
          <nav className="ml-auto flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/login">
                Get Started <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="relative w-full py-20 md:py-32 lg:py-40">
          <div className="container px-4 sm:px-6 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24">
            <div className="flex flex-col justify-center space-y-6">
              <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-foreground">
                Your Personal AI Health Assistant
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                GemiWell empowers you to take control of your health with AI-driven insights, tracking, and personalized coaching.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/login">Get Started Free</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#features">Learn More <ChevronRight className="ml-2" /></Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              {heroImage && (
                <Image
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  width={1200}
                  height={800}
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover shadow-2xl"
                  data-ai-hint={heroImage.imageHint}
                />
              )}
               <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
            </div>
          </div>
        </section>

        <section id="features" className="w-full bg-muted/50 py-20 md:py-32">
          <div className="container px-4 sm:px-6">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">A Smarter Way to Manage Your Health</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                From AI advice to detailed tracking, GemiWell provides the tools you need for a healthier life.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div key={feature.title} className="flex flex-col items-start text-left bg-background p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-4 rounded-full bg-primary/20 p-3 text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 font-headline text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex h-20 items-center justify-between px-4 sm:px-6">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} GemiWell. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
