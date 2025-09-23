import { useContext, useState } from "react";
import { Home, LogIn, UserPlus, LogOut, Menu, X, User } from "lucide-react";

// Mock context for demo - replace with your actual imports
const mockAuthContext = { 
    user: { name: "John Doe", role: "admin" }, // Set to null to see logged out state
    logout: () => console.log('Logout clicked') 
};

const Navbar = () => {
    // const { user, logout } = useContext(AuthContext); // Use your actual context
    const { user, logout } = mockAuthContext;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLinkClick = (path) => {
        console.log('Navigate to:', path); // Replace with your actual navigation
        setIsMobileMenuOpen(false);
    };

    const NavLink = ({ to, children, icon: Icon, onClick }) => (
        <button
            onClick={() => onClick ? onClick() : handleLinkClick(to)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 
                     hover:bg-blue-50 transition duration-200 ease-in-out font-medium"
        >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{children}</span>
        </button>
    );

    const MobileNavLink = ({ to, children, icon: Icon, onClick }) => (
        <button
            onClick={() => onClick ? onClick() : handleLinkClick(to)}
            className="flex items-center space-x-3 w-full px-4 py-3 text-left text-gray-700 hover:text-blue-600 
                     hover:bg-blue-50 transition duration-200 ease-in-out font-medium rounded-lg"
        >
            {Icon && <Icon className="h-5 w-5" />}
            <span>{children}</span>
        </button>
    );

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center">
                        <button
                            onClick={() => handleLinkClick('/')}
                            className="flex items-center space-x-2 text-blue-600 font-bold text-xl hover:text-blue-700 transition duration-200"
                        >
                            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Home className="h-5 w-5 text-white" />
                            </div>
                            <span>Dashboard</span>
                        </button>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-2">
                        <NavLink to="/" icon={Home}>
                            Home
                        </NavLink>

                        {!user && (
                            <>
                                <NavLink to="/login" icon={LogIn}>
                                    Login
                                </NavLink>
                                <NavLink to="/register" icon={UserPlus}>
                                    Register
                                </NavLink>
                            </>
                        )}

                        {user && (
                            <div className="flex items-center space-x-3">
                                {/* User Info */}
                                <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg">
                                    <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center">
                                        <User className="h-3 w-3 text-white" />
                                    </div>
                                    <div className="text-sm">
                                        <div className="font-medium text-gray-900">{user.name}</div>
                                        <div className="text-gray-500 capitalize">{user.role}</div>
                                    </div>
                                </div>
                                
                                {/* Logout Button */}
                                <button
                                    onClick={logout}
                                    className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 
                                             hover:bg-red-100 hover:text-red-700 rounded-lg transition duration-200 
                                             ease-in-out font-medium border border-red-200"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 
                                     transition duration-200 ease-in-out"
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            <MobileNavLink to="/" icon={Home}>
                                Home
                            </MobileNavLink>

                            {!user && (
                                <>
                                    <MobileNavLink to="/login" icon={LogIn}>
                                        Login
                                    </MobileNavLink>
                                    <MobileNavLink to="/register" icon={UserPlus}>
                                        Register
                                    </MobileNavLink>
                                </>
                            )}

                            {user && (
                                <div className="space-y-3 pt-4 border-t border-gray-200 mt-3">
                                    {/* Mobile User Info */}
                                    <div className="flex items-center space-x-3 px-4 py-3 bg-blue-50 rounded-lg mx-2">
                                        <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                                            <User className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{user.name}</div>
                                            <div className="text-sm text-gray-500 capitalize">{user.role}</div>
                                        </div>
                                    </div>
                                    
                                    {/* Mobile Logout */}
                                    <button
                                        onClick={() => {
                                            logout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="flex items-center space-x-3 w-full px-4 py-3 text-left text-red-600 
                                                 hover:bg-red-50 transition duration-200 ease-in-out font-medium 
                                                 rounded-lg mx-2 border border-red-200"
                                    >
                                        <LogOut className="h-5 w-5" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;