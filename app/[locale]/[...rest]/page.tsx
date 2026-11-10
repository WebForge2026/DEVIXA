import { notFound } from 'next/navigation';

/** Routes unknown paths to the localised not-found page. */
const CatchAll = () => notFound();

export default CatchAll;
