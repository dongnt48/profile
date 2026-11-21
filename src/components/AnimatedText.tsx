import { Fragment, type CSSProperties } from 'react';

/** Keep normal text and whitespace for reading, selection and accessibility. */
export function AnimatedText({ text }: { text: string }) {
  let word = 0;
  return <>{text.split(/(\s+)/).map((part, index) => part.trim()
    ? <span className="text-word" style={{ '--word-index': word++ } as CSSProperties} key={index}>{part}</span>
    : <Fragment key={index}>{part}</Fragment>)}</>;
}
