import React from 'react';
import './style.css';

interface NavItem {
  title: string;
  url: string;
  icon?: string;
}

interface NavBarProps {
  items: NavItem[];
  activeIndex?: number;
}

const NavBar: React.FC<NavBarProps> = ({ items, activeIndex = 0 }) => {
  return (
    <nav className="nav-bar">
      <div className="nav-content">
        {items.map((item, index) => (
          <a
            key={index}
            href={item.url}
            className={`nav-item ${index === activeIndex ? 'active' : ''}`}
          >
            {item.icon && <img src={item.icon} alt="" className="nav-icon" />}
            <span>{item.title}</span>
          </a>
        ))}
      </div>
    </nav>
  );
};

export default NavBar;