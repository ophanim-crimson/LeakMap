import React, { useState } from 'react';
import { Button } from 'antd';

interface ExpandableTextProps {
  text: string;
  wordLimit?: number;
}

const ExpandableText: React.FC<ExpandableTextProps> = ({ text, wordLimit = 40 }) => {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const words = text.trim().split(/\s+/);
  if (words.length <= wordLimit) {
    return <span>{text}</span>;
  }

  const truncatedText = words.slice(0, wordLimit).join(' ') + '...';

  return (
    <span>
      {expanded ? text : truncatedText}{' '}
      <Button 
        type="link" 
        onClick={() => setExpanded(!expanded)} 
        style={{ padding: 0, height: 'auto', fontSize: 'inherit', verticalAlign: 'baseline' }}
      >
        {expanded ? 'View Less' : 'View More'}
      </Button>
    </span>
  );
};

export default ExpandableText;
