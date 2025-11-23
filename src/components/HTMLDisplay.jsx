import { component$ } from '@builder.io/qwik';

export const HTMLDisplay = component$(({ html }) => {
  // Simple syntax highlighting function
  const highlightHTML = (code) => {
    return code
      // Highlight tags
      .replace(/(&lt;\/?)([a-z0-9]+)(.*?)(&gt;)/gi, 
        '$1<span class="text-blue-600 font-semibold">$2</span>$3$4')
      // Highlight attributes
      .replace(/\s([a-z-]+)=/gi, 
        ' <span class="text-purple-600">$1</span>=')
      // Highlight attribute values
      .replace(/=&quot;([^&]*)&quot;/gi, 
        '=<span class="text-green-600">&quot;$1&quot;</span>')
      // Highlight closing brackets
      .replace(/(&lt;|&gt;)/g, 
        '<span class="text-gray-500">$1</span>');
  };

  // Escape HTML for display
  const escapedHTML = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  const highlighted = highlightHTML(escapedHTML);

  return (
    <pre class="text-sm leading-relaxed whitespace-pre-wrap break-words">
      <code dangerouslySetInnerHTML={highlighted} />
    </pre>
  );
});




