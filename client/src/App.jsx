import React, { useState } from 'react';

function Heading({ text, children }) {
  return (
    <div style={{ marginLeft: '20px', marginTop: '10px' }}>
      <strong>{text}</strong>
      {children && children.length > 0 && (
        <div style={{ marginLeft: '20px' }}>
          {children.map((child, index) => (
            <Heading key={index} text={child.text} children={child.children} />
          ))}
        </div>
      )}
    </div>
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

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Notion Recall</h1>
      <input
        type="text"
        placeholder="Enter page name"
        value={pageName}
        onChange={(e) => setPageName(e.target.value)}
        style={{ padding: '10px', width: '300px' }}
      />
      <button onClick={handleSubmit} style={{ marginLeft: '10px', padding: '10px' }}>
        Fetch Page
      </button>
      <div style={{ marginTop: '20px' }}>
        <strong>Response:</strong>
        <p>{response}</p>
      </div>
      {headings && (
        <div style={{ textAlign: 'left', marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <strong>Headings:</strong>
          {headings.map((node, index) => (
            <Heading key={index} text={node.text} children={node.children} />
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
