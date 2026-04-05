'use client';

import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import type { PartialBlock } from '@blocknote/core';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';

export default function BlockNoteEditor({ 
    initialContent, 
    onChange 
}: { 
    initialContent: string; 
    onChange: (content: string) => void;
}) {
    // Parse the initial content, if valid JSON, otherwise undefined
    let parsedContent: PartialBlock[] | undefined = undefined;
    try {
        if (initialContent) {
            parsedContent = JSON.parse(initialContent);
        }
    } catch (e) {
        console.error('Error parsing blocknote content', e);
    }

    // Creates a new editor instance.
    const editor = useCreateBlockNote({
        initialContent: parsedContent,
    });

    return (
        <MantineProvider>
            <BlockNoteView 
                editor={editor} 
                onChange={() => {
                    // Save the blocks back as a JSON string
                    onChange(JSON.stringify(editor.document));
                }}
                theme="light"
                style={{ 
                    paddingTop: 10,
                    '--bn-colors-editor-background': 'transparent' // integrate well with the app
                } as React.CSSProperties}
            />
            <style dangerouslySetInnerHTML={{ __html: `
                .bn-container a {
                    color: #2563EB !important;
                    text-decoration: underline !important;
                    cursor: pointer !important;
                }
                .bn-container a:hover {
                    color: #1D4ED8 !important;
                }
            `}} />
        </MantineProvider>
    );
}
