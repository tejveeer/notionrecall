import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Checkbox } from './components/ui/checkbox'; // Assuming Checkbox is available in your UI library
import { ChevronRight } from 'lucide-react'; // Import ChevronRight from lucide-react

function Heading({ text, children, ancestors = [], handleSelect, handleDeselect }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isParentSelected = ancestors.some((ancestor) => ancestor.selected);

  const handleCheckboxChange = (checked) => {
    console.log(checked, text);
    if (checked) {
      handleSelect(text);
    } else {
      handleDeselect(text);
    }
  };

  return (
    <div className="flex items-start gap-2 mb-4">
      {children && <ChevronRight
        className={`cursor-pointer transform ${
          isExpanded ? 'rotate-90' : ''
        } mt-[11px]`}
        onClick={() => setIsExpanded(!isExpanded)}
        size={25}
      />}
      <Card className="flex-1">
        <CardHeader className="flex items-center gap-2">
          <Checkbox
            checked={isParentSelected}
            onCheckedChange={handleCheckboxChange}
            className="rounded bg-gray-200"
          />
          <CardTitle className="text-lg font-semibold">{text}</CardTitle>
        </CardHeader>
        {isExpanded && children && children.length > 0 && (
          <CardContent>
            {children.map((child, index) => (
              <Heading
                key={index}
                text={child.text}
                children={child.children}
                ancestors={[...ancestors, { text, selected: isParentSelected }]}
                handleSelect={handleSelect}
                handleDeselect={handleDeselect}
              />
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function App() {
  const [pageName, setPageName] = useState('');
  const [response, setResponse] = useState('');
  const [headings, setHeadings] = useState(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [selectedHeadings, setSelectedHeadings] = useState([]);
  const [deselectedHeadings, setDeselectedHeadings] = useState([]);

  const handleSelect = (heading) => {
    setSelectedHeadings((prev) => [...prev, heading]);
    setDeselectedHeadings((prev) => prev.filter((item) => item !== heading));
  };

  const handleDeselect = (heading) => {
    setDeselectedHeadings((prev) => [...prev, heading]);
    setSelectedHeadings((prev) => prev.filter((item) => item !== heading));
  };

  const handleSubmit = async () => {
    setIsButtonDisabled(true); // Disable the button
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
    } finally {
      setIsButtonDisabled(false); // Re-enable the button
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setIsButtonDisabled(true); // Disable the button
      handleSubmit();
    }
  };

  const onInputChange = (e) => {
    setResponse('');
    setPageName(e.target.value);
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 text-center">
      <h1 className="text-3xl font-bold mb-6">Notion Recall</h1>
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Enter page name"
          value={pageName}
          onChange={onInputChange}
          onKeyDown={handleKeyDown} // Listen for Enter key
          className="flex-1"
        />
        <Button
          onClick={handleSubmit}
          disabled={isButtonDisabled} // Disable the button when necessary
          className={`px-4 py-2 text-white ${
            isButtonDisabled ? 'bg-black cursor-not-allowed' : 'bg-black hover:bg-gray-800 cursor-pointer'
          }`}
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
          <div className="mt-4">
            {headings.map((node, index) => (
              <Heading
                key={index}
                text={node.text}
                children={node.children}
                ancestors={[]} // Top-level headings have no ancestors
                handleSelect={handleSelect}
                handleDeselect={handleDeselect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
