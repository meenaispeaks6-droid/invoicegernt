import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X } from "lucide-react";
const navItems = [{
  name: "DASHBOARD",
  path: "/dashboard"
}, {
  name: "INVOICES",
  path: "/"
}, {
  name: "CLIENTS",
  path: "/clients"
}];
const rightNavItems = [{
  name: "REPORTS",
  path: "/reports"
}, {
  name: "SETTINGS",
  path: "/settings"
}];
export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    signOut
  } = useAuth();
  const isHome = location.pathname === "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
    setMobileMenuOpen(false);
  };
  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };
  const allNavItems = [...navItems, ...rightNavItems];
  return <>
      <header className={`flex items-center justify-between px-4 md:px-8 py-4 border-b border-white/10 ${isHome ? "bg-[#009966]" : "bg-black"}`}>

        {/* Desktop: Left nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return <Link key={item.path} to={item.path} className={`text-sm font-medium tracking-widest transition-colors ${isActive ? "text-white" : "text-white/50 hover:text-white"}`}>
                {item.name}
              </Link>;
        })}
        </nav>

        {/* Logo - always centered */}
        <Link to="/" className="font-display text-xl md:text-2xl tracking-tight text-white">
          BILLIE
        </Link>

        {/* Desktop: Right nav */}
        <nav className="hidden md:flex items-center gap-8">
          {rightNavItems.map(item => {
          const isActive = location.pathname === item.path;
          return <Link key={item.path} to={item.path} className={`text-sm font-medium tracking-widest transition-colors ${isActive ? "text-white" : "text-white/50 hover:text-white"}`}>
                {item.name}
              </Link>;
        })}
          <button onClick={handleLogout} className="text-sm font-medium tracking-widest transition-colors text-white/50 hover:text-white">
            LOG OUT
          </button>
        </nav>

        {/* Mobile: Hamburger button */}
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white p-1" aria-label="Toggle menu">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && <div className={`fixed inset-0 z-50 ${isHome ? "bg-[#009966]" : "bg-black"}`}>
          <div className="flex flex-col h-full">
            {/* Mobile menu header */}
            <div className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-white/10">
              <Link to="/" onClick={handleNavClick} className="font-display text-xl tracking-tight text-white">
                BILLIE
              </Link>
              <button onClick={() => setMobileMenuOpen(false)} className="text-white p-1" aria-label="Close menu">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile nav items */}
            <nav className="flex-1 flex flex-col items-start justify-center px-4 md:px-8 gap-[16px]">
              {allNavItems.map((item, index) => {
            return <Link 
              key={item.path} 
              to={item.path} 
              onClick={handleNavClick} 
              className="font-display text-3xl tracking-tight text-white animate-fade-in-up"
              style={{ 
                animationDelay: `${index * 50}ms`,
                opacity: 0,
              }}
            >
                    {item.name}
                  </Link>;
          })}
              <button 
                onClick={handleLogout} 
                className="font-display text-3xl tracking-tight text-white animate-fade-in-up"
                style={{ 
                  animationDelay: `${allNavItems.length * 50}ms`,
                  opacity: 0,
                }}
              >
                LOG OUT
              </button>
            </nav>
          </div>
        </div>}
    </>;
}