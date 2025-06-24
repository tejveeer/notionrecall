import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { ChevronRight } from 'lucide-react';

export default function Home() {
  const [pageName, setPageName] = useState('');
  const [response, setResponse] = useState('');
  const [headings, setHeadings] = useState(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [headingSelections, setHeadingSelections] = useState({
    selections: new Set(),
    deselections: new Set(),
  });

  const getIdOfHeadingChildren = (heading) => {
    const ids = [];
    const traverse = (node) => {
      ids.push(node.id);
      node.children.forEach(traverse);
    };
    traverse(heading);
    return ids;
  }

  const selectHeading = (id) => {
    const ids = getIdOfHeadingChildren(id);
    setHeadingSelections((prev) => ({
      selections: new Set([...prev.selections, ...ids]),
      deselections: new Set([...prev.deselections].filter(id => !ids.includes(id))),
    }));
  }

  const deselectHeading = (id) => {
    const ids = getIdOfHeadingChildren(id);
    setHeadingSelections((prev) => ({
      deselections: new Set([...prev.deselections, ...ids]),
      selections: new Set([...prev.selections].filter(id => !ids.includes(id)))
    }));
  }

  const isIdSelected = (id) => {
    return headingSelections.selections.has(id) && !headingSelections.deselections.has(id);
  }

  const handleSubmit = async () => {
    setIsButtonDisabled(true);
    setHeadings(null);
    setHeadingSelections({
      selections: new Set(),
      deselections: new Set(),
    });

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
      setIsButtonDisabled(false);
    }
  };

  const handleSelectedHeadingSubmission = async () => {
    const { selections, deselections } = headingSelections;
    const sanitized = sanitizeHeadingSelections(selections, deselections);
    console.log('Sanitized Selections:', sanitized.selections);
    console.log('Sanitized Deselections:', sanitized.deselections);

    try {
      const res = await fetch('http://localhost:3000/get-heading-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptList: sanitized.selections, rejectList: sanitized.deselections }),
      });
      const data = await res.json();

      if (data.success) {
        console.log(data.content)
      } else {
        console.log("Unsuccessful fetch");
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setResponse('Error fetching page');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 text-center">
      <h1 className="text-3xl font-bold mb-6">Notion Recall</h1>
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Enter page name"
          value={pageName}
          onChange={(e) => {
            setResponse('');
            setPageName(e.target.value);
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="flex-1"
        />
        <Button
          onClick={handleSubmit}
          disabled={isButtonDisabled}
          className={`px-4 py-2 text-white ${
            isButtonDisabled ? 'bg-black cursor-not-allowed' : 'bg-black hover:bg-gray-800 cursor-pointer'
          }`}
        >
          Fetch Page
        </Button>
      </div>
      <div className="flex gap-4 mb-6">
        <Button
          onClick={handleSelectedHeadingSubmission}
          className="px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 cursor-pointer"
        >
          Submit
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
                id={node.id}
                text={node.text}
                children={node.children}
                selectHeading={selectHeading}
                deselectHeading={deselectHeading}
                isIdSelected={isIdSelected}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Heading({
  id,
  text,
  children,
  selectHeading,
  deselectHeading,
  isIdSelected
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isChecked = isIdSelected(id);

  const handleCheckboxChange = () => {
    const newValue = !isChecked;
    const map = { id, children };
    if (newValue) {
      selectHeading(map);
    } else {
      deselectHeading(map);
    }
  };

  return (
    <div className="flex items-start gap-2 mb-4">
      {children?.length > 0 && (
        <ChevronRight
          className={`cursor-pointer transform ${isExpanded ? 'rotate-90' : ''} mt-[11px]`}
          onClick={() => setIsExpanded(!isExpanded)}
          size={25}
        />
      )}
      <Card className="flex-1">
        <CardHeader className="flex items-center gap-2">
          <Checkbox
            checked={isChecked}
            onCheckedChange={handleCheckboxChange}
            className="rounded bg-gray-200"
          />
          <CardTitle className="text-lg font-semibold">{text}</CardTitle>
        </CardHeader>
        {isExpanded && children?.length > 0 && (
          <CardContent>
            {children.map((child, index) => (
              <Heading
                key={index}
                id={child.id}
                text={child.text}
                children={child.children}
                selectHeading={selectHeading}
                deselectHeading={deselectHeading}
                isIdSelected={isIdSelected}
              />
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// First sanitization: Remove deselections whose parents are not selected
function removeDeselectionsWithoutSelectedParents(selections, deselections) {
  const sanitizedDeselections = new Set([...deselections].filter((id) => {
    const parentId = id.split('.').slice(0, -1).join('.');
    return selections.has(parentId);
  }));
  return sanitizedDeselections;
}

// Second sanitization: Remove child elements if their parent is in the set
function removeChildElementsWithSelectedParents(set) {
  const sanitizedSet = new Set([...set].filter((id) => {
    const parentId = id.split('.').slice(0, -1).join('.');
    return !set.has(parentId);
  }));
  return sanitizedSet;
}

// Sanitizes the selections and deselections sets
function sanitizeHeadingSelections(selections, deselections) {
  const sanitizedDeselections = removeDeselectionsWithoutSelectedParents(selections, deselections);
  const sanitizedSelections = removeChildElementsWithSelectedParents(selections);
  const finalDeselections = removeChildElementsWithSelectedParents(sanitizedDeselections);

  return {
    selections: Array.from(sanitizedSelections),
    deselections: Array.from(finalDeselections),
  };
}
