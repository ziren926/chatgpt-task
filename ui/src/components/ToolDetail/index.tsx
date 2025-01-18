// ui/src/components/ToolDetail/index.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { FetchList } from '../../utils/api';
import './style.css';

interface ToolData {
  id: string;
  name: string;
  desc: string;
  logo: string;
  url: string;
  catelog: string;
  content?: string;
}

const ToolDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tool, setTool] = useState<ToolData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadToolData = async () => {
      try {
        const response = await FetchList();
        const foundTool = response.tools.find((t: ToolData) => t.id === id);
        setTool(foundTool || null);
      } catch (error) {
        console.error('Failed to load tool details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadToolData();
  }, [id]);

  if (loading) return <Spin size="large" className="tool-detail-loading" />;
  if (!tool) return <div className="tool-detail-error">工具不存在</div>;

  return (
    <div className="tool-detail">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/')}
        className="back-button"
      >
        返回
      </Button>

      <Card className="tool-detail-card">
        <div className="tool-detail-header">
          <img src={tool.logo} alt={tool.name} className="tool-logo" />
          <div className="tool-info">
            <h1>{tool.name}</h1>
            <span className="tool-category">{tool.catelog}</span>
          </div>
        </div>

        <div className="tool-detail-content">
          <p className="tool-description">{tool.desc}</p>

          <div className="tool-content">
            {tool.content ? (
              <div dangerouslySetInnerHTML={{ __html: tool.content }} />
            ) : (
              <p>暂无详细内容</p>
            )}
          </div>

          <Button
            type="primary"
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            访问网站
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ToolDetail;