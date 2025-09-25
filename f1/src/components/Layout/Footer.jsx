import React from 'react';
import { Facebook, Twitter, Linkedin, Mail, Phone, MapPin, Heart } from 'lucide-react';

const Footer = () => {
  const handleSocialClick = (platform) => {
    const urls = {
      facebook: 'https://facebook.com',
      twitter: 'https://twitter.com',
      linkedin: 'https://linkedin.com'
    };
    window.open(urls[platform], '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <div className="h-6 w-6 bg-white rounded-sm"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Task Management</h3>
            </div>
            <p className="text-gray-600 mb-6 max-w-md">
              Streamline your workflow and boost productivity with our comprehensive task management solution. 
              Built for teams of all sizes.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-600">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-sm">support@taskmanagement.com</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-600">
                <Phone className="h-4 w-4 text-blue-600" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-600">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm">123 Business Ave, Suite 100</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {['About Us', 'Features', 'Pricing', 'Support', 'Documentation'].map((link) => (
                <li key={link}>
                  <button className="text-gray-600 hover:text-blue-600 transition duration-200 text-sm">
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
            <ul className="space-y-3">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Help Center', 'Blog'].map((link) => (
                <li key={link}>
                  <button className="text-gray-600 hover:text-blue-600 transition duration-200 text-sm">
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="max-w-md">
            <h4 className="font-semibold text-gray-900 mb-2">Stay Updated</h4>
            <p className="text-gray-600 text-sm mb-4">
              Get the latest updates and features delivered to your inbox.
            </p>
            <div className="flex space-x-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         transition duration-200"
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                               transition duration-200 text-sm font-medium">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            {/* Copyright */}
            <div className="flex items-center space-x-2 text-gray-600 text-sm">
              <span>&copy; 2025 Task Management. All Rights Reserved.</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center space-x-1">
                <span>Made with</span>
                <Heart className="h-4 w-4 text-red-500 fill-current" />
                <span>for productivity</span>
              </span>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 mr-2">Follow us:</span>
              <button
                onClick={() => handleSocialClick('facebook')}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleSocialClick('twitter')}
                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-50 rounded-lg transition duration-200"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleSocialClick('linkedin')}
                className="p-2 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;