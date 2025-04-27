import React from "react";
import { Link } from "react-router-dom";

// icons
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-10 px-6">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Column 1: About */}
        <div>
          <h3 className="text-lg font-semibold text-white">About Us</h3>
          <p className="mt-4 text-sm leading-relaxed">
            We are committed to providing the best solutions to help businesses
            and individuals thrive in a constantly evolving digital landscape.
          </p>
        </div>

        {/* Column 2: Useful Links */}
        <div>
          <h3 className="text-lg font-semibold text-white">Useful Links</h3>
          <ul className="mt-4 space-y-2">
            <li>
              <Link
                to="/about"
                className="text-sm hover:text-white transition-colors"
              >
                About Us
              </Link>
            </li>
            <li>
              <Link
                to="/services"
                className="text-sm hover:text-white transition-colors"
              >
                Services
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="text-sm hover:text-white transition-colors"
              >
                Contact Us
              </Link>
            </li>
            <li>
              <Link
                to="/privacy"
                className="text-sm hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Social Media */}
        <div>
          <h3 className="text-lg font-semibold text-white">Follow Us</h3>
          <div className="flex gap-4 mt-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              <FaFacebookF className="h-6 w-6" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              <FaTwitter className="h-6 w-6" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              <FaInstagram className="h-6 w-6" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              <FaLinkedinIn className="h-6 w-6" />
            </a>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="border-t border-gray-700 mt-8 pt-6 text-center">
        <p className="text-sm">
          © {new Date().getFullYear()} YourCompany. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
