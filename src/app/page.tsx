import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Rocket, Layers, Palette, FormInput, Database, Zap, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-12 py-12 md:px-16">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <Rocket className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Centercode Next.js Starter</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Production-ready template with Next.js 15, React 19, TypeScript, and shadcn/ui
          </p>
        </div>

        <Separator gradient />

        {/* Feature Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card gradient>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">Component Library</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                shadcn/ui components with Radix primitives, fully typed and accessible.
              </p>
            </CardContent>
          </Card>

          <Card gradient>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-500/10">
                  <Database className="h-5 w-5 text-green-500" />
                </div>
                <CardTitle className="text-xl">Database Ready</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Postgres 17 with native pg driver. No ORM overhead, just SQL.
              </p>
            </CardContent>
          </Card>

          <Card gradient>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-500/10">
                  <Shield className="h-5 w-5 text-blue-500" />
                </div>
                <CardTitle className="text-xl">Type Safe</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                TypeScript strict mode enforced. No any types, full autocomplete.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Form Examples & Getting Started */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card gradient>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FormInput className="h-5 w-5 text-blue-500" />
                <CardTitle>Form Components</CardTitle>
              </div>
              <CardDescription>Common form inputs from shadcn/ui</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Text Input */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" />
              </div>

              {/* Select */}
              <div className="space-y-2">
                <Label htmlFor="framework">Framework</Label>
                <Select defaultValue="next">
                  <SelectTrigger id="framework">
                    <SelectValue placeholder="Select a framework" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="next">Next.js</SelectItem>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="vue">Vue</SelectItem>
                    <SelectItem value="svelte">Svelte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Switch/Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications" className="cursor-pointer">
                  Enable notifications
                </Label>
                <Switch id="notifications" />
              </div>
            </CardContent>
          </Card>

          <Card gradient>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <CardTitle>Get Started</CardTitle>
              </div>
              <CardDescription>Three steps to production</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
                <li>Fill out PROJECT.md with your details</li>
                <li>Update DESIGN.md with your palette</li>
                <li>Start building features!</li>
              </ol>
              <Button className="w-full" variant="outline">
                View Documentation
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Design System Showcase */}
        <Card gradient>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-500" />
              <CardTitle>Design System</CardTitle>
            </div>
            <CardDescription>Panel colors using gray-950 backgrounds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Button Variants */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Button Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            {/* Button Sizes */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Button Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>

            {/* Typography Scale */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Typography Scale</h3>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">text-xs - Captions and labels</p>
                <p className="text-sm text-muted-foreground">text-sm - Secondary text</p>
                <p className="text-base">text-base - Body text (default)</p>
                <p className="text-lg font-semibold">text-lg - Subheadings</p>
                <p className="text-xl font-semibold">text-xl - Section headers</p>
                <p className="text-2xl font-bold">text-2xl - Page headers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
