'use client';

import { PostList } from '../../components/content/PostList';
import { posts } from '../../lib/data/posts';

export default function ContentPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-8">
        <header className="text-center py-16 border-b border-border relative">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-7xl font-black text-primary font-mono mb-4 transform -rotate-2 italic" 
                style={{
                  textShadow: '3px 3px 0px hsl(var(--primary) / 0.8), 6px 6px 0px hsl(var(--primary) / 0.3), 9px 9px 0px hsl(var(--primary) / 0.2)' 
                }}
                data-testid="title-nexus">
              Nexus
            </h1>
            <p className="text-lg text-foreground absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-3 bg-background px-4 whitespace-nowrap"
               data-testid="text-tagline">
              Decentralized insights for the next generation of builders
            </p>
          </div>
        </header>

        <main className="py-8">
          <PostList posts={posts} />
        </main>
      </div>
    </div>
  );
}