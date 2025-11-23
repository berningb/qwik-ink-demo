import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { IndexPage } from './pages/IndexPage';
import { SideBySidePage } from './pages/SideBySidePage';
import { TextAnalysisPage } from './pages/TextAnalysisPage';
import './global.css';

export const Root = component$(() => {
  const currentPage = useSignal('index');

  // Handle hash-based routing
  useVisibleTask$(() => {
    const updatePage = () => {
      const hash = window.location.hash.slice(1) || 'index';
      if (hash === 'side-by-side' || hash === 'index' || hash === 'text-analysis') {
        currentPage.value = hash;
      }
    };
    
    updatePage();
    window.addEventListener('hashchange', updatePage);
    
    return () => {
      window.removeEventListener('hashchange', updatePage);
    };
  });

  return (
    <>
      {currentPage.value === 'index' && <IndexPage />}
      {currentPage.value === 'side-by-side' && <SideBySidePage />}
      {currentPage.value === 'text-analysis' && <TextAnalysisPage />}
    </>
  );
});
