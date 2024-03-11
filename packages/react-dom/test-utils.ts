import { ReactElementType } from 'shared/ReactTypes';
// import { createRoot } from 'react-dom';
import ReactDOM from 'react-dom'

const { createRoot } = ReactDOM

export function renderIntoDocument(element: ReactElementType) {
	const div = document.createElement('div');
	return createRoot(div).render(element);
}
