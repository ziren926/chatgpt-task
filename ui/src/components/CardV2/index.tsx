// ui/src/components/CardV2/index.tsx
import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Tooltip } from "antd";
import "./index.css";

interface CardV2Props {
  id: string;                   // 添加 id 用于路由
  title: string;
  url: string;
  des: string;
  logo: string;
  catelog: string;
  index: number;
  isSearching: boolean;
  onClick?: () => void;
}

const CardV2: React.FC<CardV2Props> = ({
  id,
  title,
  url,
  des,
  logo,
  catelog,
  index,
  isSearching,
  onClick,
}) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleImgError = () => {
    setImgError(true);
  };

  const handleClick = () => {
    if (url === "toggleJumpTarget") {
      if (onClick) onClick();
      return;
    }
    // 点击时先触发原有的 onClick
    if (onClick) onClick();
    // 然后导航到详情页
    navigate(`/tool/${id}`);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const renderLogo = () => {
    if (imgError) {
      return (
        <div className="card-logo-placeholder">
          {title.slice(0, 2).toUpperCase()}
        </div>
      );
    }

    return (
      <img
        src={logo}
        onError={handleImgError}
        alt={title}
        className="card-logo"
      />
    );
  };

  return (
    <div
      className={`card ${isHovering ? "card-hover" : ""}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {renderLogo()}
      <div className="card-content">
        <Tooltip title={title}>
          <h3 className="card-title">
            {title}
            {isSearching && (
              <span className="card-index">#{index + 1}</span>
            )}
          </h3>
        </Tooltip>
        <Tooltip title={des}>
          <p className="card-description">{des}</p>
        </Tooltip>
        <span className="card-category">{catelog}</span>
      </div>
    </div>
  );
};

export default CardV2;