import { FormEvent, useMemo, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, Sparkles, X } from 'lucide-react';
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

export default function ChatbotWidget() {
    const user = useStore((state) => state.user);
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        makeAssistantMessage('Hi, I can help with order tracking, delivery updates, offers, and finding products.'),
    ]);
    const scrollerRef = useRef<HTMLDivElement | null>(null);

    const placeholder = useMemo(
        () => (user ? 'Ask about orders, offers, or products...' : 'Sign in to use chat support'),
        [user]
    );

    const appendMessage = (message: ChatMessage) => {
        setMessages((current) => [...current, message]);
        window.setTimeout(() => {
            scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
        }, 30);
    };

    const handleSend = async (rawMessage?: string) => {
        const nextMessage = (rawMessage ?? input).trim();
        if (!nextMessage || isSending) return;

        if (!user) {
            setIsOpen(true);
            appendMessage(makeAssistantMessage('Please sign in to chat with Happy Greens support.'));
            if (!rawMessage) setInput('');
            return;
        }

        const userMessage: ChatMessage = {
            id: `${Date.now()}-user`,
            role: 'user',
            text: nextMessage,
        };

        setIsOpen(true);
        setIsSending(true);
        setMessages((current) => [...current, userMessage]);
        setInput('');

        try {
            const response = await sendChatMessage(nextMessage);
            appendMessage(makeAssistantMessage(response.response, response.products));
        } catch (error: any) {
            const fallback = error?.response?.data?.message || 'I could not respond right now. Please try again in a moment.';
            appendMessage(makeAssistantMessage(fallback));
        } finally {
            setIsSending(false);
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        await handleSend();
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-xl transition hover:scale-[1.03] hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200"
                aria-label="Toggle chat support"
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </button>

            {isOpen ? (
                <div className="fixed bottom-20 right-4 z-50 flex h-[32rem] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-br from-green-600 via-emerald-500 to-lime-400 px-4 py-4 text-white">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                                <Bot className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">Happy Greens Assistant</p>
                                <p className="text-xs text-white/80">Quick help for orders, offers, and products</p>
                            </div>
                        </div>
                        <button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-2 transition hover:bg-white/10">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                            {QUICK_SUGGESTIONS.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => void handleSend(suggestion)}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-green-300 hover:text-green-700"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div ref={scrollerRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
                        {messages.map((message) => (
                            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                                        message.role === 'user'
                                            ? 'rounded-br-md bg-green-600 text-white'
                                            : 'rounded-bl-md bg-white text-slate-700 border border-slate-200'
                                    }`}
                                >
                                    <p className="whitespace-pre-line">{message.text}</p>
                                    {message.products?.length ? (
                                        <div className="mt-3 space-y-2">
                                            {message.products.map((product) => (
                                                <Link
                                                    key={product.id}
                                                    to={`/product/${product.id}`}
                                                    onClick={() => setIsOpen(false)}
                                                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-2 transition hover:border-green-200 hover:bg-green-50"
                                                >
                                                    <div className="h-11 w-11 overflow-hidden rounded-xl bg-white">
                                                        {product.image_url ? (
                                                            <img src={product.image_url} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-slate-300">
                                                                <Sparkles className="h-4 w-4" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                                                        <p className="text-xs text-green-700">Rs.{Number(product.price).toFixed(2)}</p>
                                                        <p className="text-[11px] text-slate-500">View product</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                        {isSending ? (
                            <div className="flex justify-start">
                                <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                                    Typing...
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <form onSubmit={handleSubmit} className="border-t border-slate-100 bg-white p-3">
                        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-green-400 focus-within:bg-white">
                            <input
                                type="text"
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                placeholder={placeholder}
                                disabled={isSending || !user}
                                className="h-11 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                            />
                            <button
                                type="submit"
                                disabled={isSending || !input.trim() || !user}
                                className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                aria-label="Send chat message"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}
        </>
    );
}
