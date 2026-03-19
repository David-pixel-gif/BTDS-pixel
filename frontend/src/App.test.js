import { render, screen } from '@testing-library/react';
import App from './App';

test('renders landing page content', () => {
  render(<App />);
  expect(screen.getByText(/brain tumor detection/i)).toBeInTheDocument();
});
