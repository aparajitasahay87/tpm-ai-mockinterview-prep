// src/components/WhiteboardCanvas.jsx
import React, { useState, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Tldraw, useEditor } from 'tldraw';
import 'tldraw/tldraw.css';

const WhiteboardCanvas = forwardRef(({ initialData = null }, ref) => {
  const [editor, setEditor] = useState(null);

  // This callback is called when the Tldraw editor is mounted and ready
  const handleMount = useCallback((editorInstance) => {
    setEditor(editorInstance);
    // If initialData is provided (e.g., loading a previously saved drawing)
    if (initialData) {
      // Tldraw needs to load the document and page state
      editorInstance.loadDocument(initialData.document);
      editorInstance.setPageState(initialData.pageStates.page1); // Assuming 'page1' is the default page
    }
  }, [initialData]);

  // Expose a method to the parent component via the ref
  // This allows the parent to call `whiteboardRef.current.getCurrentDrawingData()`
  useImperativeHandle(ref, () => ({
    getCurrentDrawingData() {
      if (!editor) {
        console.warn('Tldraw editor not mounted yet, cannot get snapshot.');
        return null;
      }
      return editor.getSnapshot(); // Tldraw's method to get the full state of the drawing
    }
  }));

  return (
    // The container for Tldraw must have explicit dimensions
    <div style={{ position: 'relative', width: '100%', height: '600px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
      <Tldraw
        onMount={handleMount}
        // You can customize the UI here if needed, e.g., hide certain tools
        // We're leaving it default for a full whiteboard experience
      />
    </div>
  );
});

export default WhiteboardCanvas;