import { type Post } from '../../shared/schema';
import { users } from '../../lib/data/users';

interface Web3PostListProps {
  posts: Post[];
  isWalletConnected: boolean;
  isAuthenticated: boolean;
  onTransfer?: (recipient: string, amount: string) => Promise<void>;
  isTransferring?: boolean;
}

export function Web3PostList({ 
  posts, 
  isWalletConnected, 
  isAuthenticated, 
  onTransfer, 
  isTransferring 
}: Web3PostListProps) {
  const handleTip = async (post: Post) => {
    if (!onTransfer) {
      console.log('Transfer function not available');
      return;
    }

    // Find the author's wallet address from users data
    const author = users.find(user => user.id === post.authorId);
    if (!author) {
      console.error('Author wallet address not found');
      return;
    }

    console.log(`Supporting ${post.authorName} with 0.01 YTEST.USD`);
    await onTransfer(author.walletAddress, '0.01');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 14) return `${Math.ceil(diffDays / 7)} week ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getButtonText = () => {
    if (!isWalletConnected) return 'Connect Wallet';
    if (!isAuthenticated) return 'Authenticating...';
    if (isTransferring) return 'Supporting...';
    return 'Support 0.01 YTEST.USD';
  };

  const isButtonDisabled = !isWalletConnected || !isAuthenticated || isTransferring;

  return (
    <section className="max-w-6xl mx-auto px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        {posts.map((post, index) => (
          <article 
            key={post.id} 
            className="relative bg-background dark:bg-gray-900 border-2 border-border dark:border-gray-700 rounded-xl overflow-hidden transition-all duration-200 hover:border-primary hover:-translate-y-0.5 hover:shadow-lg"
            data-testid={`card-post-${post.id}`}
          >
            <a 
              href={`#post-${post.id}`} 
              className="block text-inherit no-underline p-6 relative h-full"
              data-testid={`link-post-${post.id}`}
            >
              <span className="absolute right-0 top-0 transform translate-x-1/4 -translate-y-1/4 rotate-12 text-6xl font-black text-primary font-mono pointer-events-none z-10 italic">
                {index + 1}
              </span>
              <div className="relative z-20 h-full flex flex-col">
                <p className="text-sm text-muted-foreground mb-4 font-semibold uppercase tracking-wide">
                  <span data-testid={`text-type-${post.id}`}>{post.type}</span>{' '}
                  <span className="opacity-50 mx-2">×</span>{' '}
                  <time dateTime={post.createdAt?.toISOString()} data-testid={`text-date-${post.id}`}>
                    {formatDate(post.createdAt?.toISOString() || new Date().toISOString())}
                  </time>
                </p>
                <h4 className="text-2xl font-bold text-foreground mb-4 line-clamp-2 font-mono tracking-tight" data-testid={`text-title-${post.id}`}>
                  {post.title}
                </h4>
                <p className="text-muted-foreground mb-auto line-clamp-3 leading-relaxed" data-testid={`text-content-${post.id}`}>
                  {post.content}
                </p>
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center font-mono text-sm font-semibold text-white uppercase border-2 border-background" data-testid={`avatar-${post.id}`}>
                      {post.authorName
                        .split(' ')
                        .map((name: string) => name[0])
                        .join('')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className={`flex items-center gap-2 text-sm font-medium px-4 py-2 border rounded-md transition-all duration-200 relative overflow-hidden ${
                        isButtonDisabled
                          ? 'border-border bg-secondary/30 text-muted-foreground cursor-not-allowed'
                          : 'border-border bg-transparent text-muted-foreground cursor-pointer hover:border-primary hover:text-primary hover:-translate-y-0.5'
                      }`}
                      disabled={isButtonDisabled}
                      onClick={(e) => {
                        e.preventDefault();
                        handleTip(post);
                      }}
                      data-testid={`button-tip-${post.id}`}
                    >
                      ⚡ {getButtonText()}
                    </button>
                  </div>
                </div>
              </div>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}