import { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, ChevronRight, MessageCircle, Send, ShoppingBag, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { sendChatMessage, type ChatProduct } from '../services/chat.service';

type ChatMessage = {
    id: string;
    role: 'assistant' | 'user';
    text: string;
    products?: ChatProduct[];
};

const QUICK_SUGGESTIONS = ['Track Order', 'View Offers', 'Browse Vegetables'];

const makeAssistantMessage = (text: string, products?: ChatProduct[]): ChatMessage => ({
    id: `${Date.now()}-${Math.random()}`,
    role: 'assistant',
    text,
    products,
});

export default function HelpSupport() {
    const user = useStore((state) => state.user);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        makeAssistantMessage('Hi, I can help with order tracking, delivery updates, offers, and finding products.'),
    ]);
    const scrollerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, isSending]);

    const handleSend = async (rawMessage?: string) => {
        const nextMessage = (rawMessage ?? input).trim();
        if (!nextMessage || isSending || !user) return;

        setMessages((current) => [...current, {
            id: `${Date.now()}-user`,
            role: 'user',
            text: nextMessage,
        }]);
        setInput('');
        setIsSending(true);

        try {
            const response = await sendChatMessage(nextMessage);
            setMessages((current) => [...current, makeAssistantMessage(response.response, response.products)]);
        } catch (error: any) {
            const fallback = error?.response?.data?.message || 'I could not respond right now. Please try again in a moment.';
            setMessages((current) => [...current, makeAssistantMessage(fallback)]);
        } finally {
            setIsSending(false);
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        await handleSend();
    };

    return (
        <section className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                    <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-green-700">Happy Greens</p>
                    <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Help &amp; Support</h1>
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
                <div className="flex items-center gap-3 bg-gradient-to-br from-green-700 via-emerald-600 to-lime-500 px-5 py-5 text-white sm:px-7">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                        <Bot className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="font-semibold">Happy Greens Assistant</h2>
                        <p className="text-sm text-white/85">Help with orders, delivery, offers, and products</p>
                    </div>
                </div>

                <div className="border-b border-slate-100 bg-slate-50 px-4 py-4 sm:px-6">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Popular questions</p>
                    <div className="flex flex-wrap gap-2">
                        {QUICK_SUGGESTIONS.map((suggestion) => (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => void handleSend(suggestion)}
                                disabled={!user || isSending}
                                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-green-300 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>

                <div ref={scrollerRef} aria-live="polite" className="min-h-[18rem] max-h-[55vh] space-y-4 overflow-y-auto bg-slate-50 px-4 py-5 sm:min-h-[24rem] sm:px-6">
                    {messages.map((message) => (
                        <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${message.role === 'user' ? 'rounded-br-md bg-green-600 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700'}`}>
                                <p className="whitespace-pre-line">{message.text}</p>
                                {message.products?.length ? (
                                    <div className="mt-3 space-y-2">
                                        {message.products.map((product) => (
                                            <Link key={product.id} to={`/product/${product.id}`} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-2 transition hover:border-green-200 hover:bg-green-50">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                                                    {product.image_url ? <img src={product.image_url} alt={product.name} loading="lazy" className="h-full w-full object-cover" /> : <Sparkles className="h-4 w-4 text-slate-300" />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                                                    <p className="text-xs text-green-700">Rs.{Number(product.price).toFixed(2)}</p>
                                                    <p className="text-[11px] text-slate-500">View product</p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-slate-400" />
                                            </Link>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ))}
                    {isSending && <div className="text-sm text-slate-500">Assistant is typing…</div>}
                    {!user && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                            Sign in to chat with support. You can also browse <Link to="/orders" className="font-semibold underline">your orders</Link> or <Link to="/shop" className="font-semibold underline">continue shopping</Link>.
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="border-t border-slate-100 bg-white p-3 sm:p-4">
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-green-400 focus-within:bg-white">
                        <input
                            type="text"
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            placeholder={user ? 'Ask about orders, offers, or products…' : 'Sign in to use chat support'}
                            disabled={isSending || !user}
                            className="h-11 min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                        />
                        <button type="submit" disabled={isSending || !input.trim() || !user} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300" aria-label="Send message">
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </form>
            </div>

            <Link to="/orders" className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-green-300">
                <ShoppingBag className="h-5 w-5 text-green-700" />
                <span className="flex-1">Need order details?</span>
                <span className="text-green-700">View order history</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
        </section>
    );
}
