import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the main app title or a key element', () => {
  render(<App />);
  const linkElement = screen.getByText(/Clinic Task Tracker/i); // Replace with a text element from your app
  expect(linkElement).toBeInTheDocument();
});