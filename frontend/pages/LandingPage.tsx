import React from 'react';
import Button from '../components/Button';

const Feature: React.FC<{icon: string, title: string, children: React.ReactNode}> = ({ icon, title, children }) => (
    <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-center">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
        <p className="text-white/70">{children}</p>
    </div>
);

const LandingPage: React.FC<{ onNavigateToLogin: () => void; onNavigateToRegister: () => void; }> = ({ onNavigateToLogin, onNavigateToRegister }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F2027] via-[#203A43] to-[#2C5364] z-0"></div>
        <main className="z-10 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
                Stop Worrying About <span className="text-[#20C997]">Expenses</span>.
            </h1>
            <p className="text-xl text-white/80 mt-4 max-w-2xl mx-auto">
                DiviPay is the simplest way to split bills with friends and family. From group trips to housemate bills, we handle the math so you don't have to.
            </p>
            <div className="flex justify-center gap-4 mt-8">
                <Button onClick={onNavigateToLogin} className="text-lg px-8 py-3">
                    Login
                </Button>
                <Button onClick={onNavigateToRegister} variant="secondary" className="text-lg px-8 py-3">
                    Register
                </Button>
            </div>

            <section className="mt-20 max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Feature icon="📊" title="Track Everything">
                        Log expenses in any currency and see who's paid for what. All in one place.
                    </Feature>
                     <Feature icon="➗" title="Split Seamlessly">
                        Split bills equally, by percentage, or by specific amounts. It's your choice.
                    </Feature>
                     <Feature icon="💸" title="Settle Up Easily">
                        See who owes who and settle debts with a click. No more awkward reminders.
                    </Feature>
                </div>
            </section>
        </main>
        <footer className="z-10 mt-16 text-white/50">
            <p>&copy; {new Date().getFullYear()} DiviPay. Hassle-free splitting.</p>
        </footer>
    </div>
  );
};

export default LandingPage;