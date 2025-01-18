// ui/src/components/AddToolButton/index.tsx

import React from 'react';
import './style.css';

interface AddToolButtonProps {
  onClick: () => void;
}

const AddToolButton: React.FC<AddToolButtonProps> = ({ onClick }) => {
  return (
    <button className="add-tool-button" onClick={onClick}>
      <svg className="add-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
      </svg>
      <span>新建项目</span>
    </button>
  );
};

export default AddToolButton;