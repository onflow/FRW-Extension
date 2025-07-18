import React, { type ReactNode } from 'react';

import { consoleWarn } from '@onflow/flow-wallet-shared/utils/console-log';

/**
 * Parse i18n message with XML-like tags and replace them with React components
 * @param messageKey - The i18n message key
 * @param componentMap - Object mapping tag names to React components
 * @returns Array of React nodes with components substituted
 */
export function translateToComponents(
  messageKey: string,
  componentMap: Record<string, React.ComponentType<{ children: ReactNode }>>
): ReactNode[] {
  const text = chrome.i18n.getMessage(messageKey);

  if (!text) {
    consoleWarn(`Translation key not found: ${messageKey}`);
    return [messageKey];
  }

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  text.replace(/<(\w+)>(.*?)<\/\1>/g, (match, tag, content, offset) => {
    // Add text before the tag
    if (offset > lastIndex) {
      parts.push(text.slice(lastIndex, offset));
    }

    // Add the component
    const Component = componentMap[tag];
    if (Component) {
      parts.push(<Component key={key++}>{content}</Component>);
    } else {
      parts.push(content);
    }

    lastIndex = offset + match.length;
    return match;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
