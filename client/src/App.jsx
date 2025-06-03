import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';

function Heading({ text, children }) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{text}</CardTitle>
      </CardHeader>
      {children && children.length > 0 && (
        <CardContent>
          {children.map((child, index) => (
            <Heading key={index} text={child.text} children={child.children} />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

function App() {
  const [pageName, setPageName] = useState('');
  const [response, setResponse] = useState('');
  const [headings, setHeadings] = useState(null);

  const handleSubmit = async () => {
    try {
      const res = await fetch('http://localhost:3000/fetch-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageName }),
      });
      const data = await res.json();

      if (data.success) {
        setHeadings(data.headings);
        setResponse('Page fetched successfully!');
      } else {
        setHeadings(null);
        setResponse(data.message || 'Failed to fetch page');
      }
    } catch (error) {
      console.error('Error fetching page:', error);
      setResponse('Error fetching page');
      setHeadings(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 text-center">
      <h1 className="text-3xl font-bold mb-6">Notion Recall</h1>
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Enter page name"
          value={pageName}
          onChange={(e) => setPageName(e.target.value)}
          onKeyDown={handleKeyDown} // Listen for Enter key
          className="flex-1"
        />
        <Button
          onClick={handleSubmit}
          className="px-4 py-2 text-white" // Light purple color
        >
          Fetch Page
        </Button>
      </div>
      <div className="mb-6">
        <strong>Response:</strong>
        <p>{response}</p>
      </div>
      {headings && (
        <div>
          <strong>Headings:</strong>
          <div className="mt-4">
            {headings.map((node, index) => (
              <Heading key={index} text={node.text} children={node.children} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
