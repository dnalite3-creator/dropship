import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import ToastContainer from './Toast';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <ToastContainer />
    </div>
  );
}
