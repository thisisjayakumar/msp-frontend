import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OutsourcingManagement from '../src/app/manager/outsourcing/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock the API service
jest.mock('@/components/API_Service/outsourcing-api', () => ({
  getAll: jest.fn(),
  getSummary: jest.fn(),
  send: jest.fn(),
  returnItems: jest.fn(),
  close: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('OutsourcingManagement Component', () => {
  const mockRequests = [
    {
      id: 1,
      request_id: 'OUT-20240101-0001',
      vendor_name: 'Test Vendor',
      status: 'draft',
      status_display: 'Draft',
      date_sent: null,
      expected_return_date: '2024-01-15',
      total_items: 2,
      is_overdue: false,
    },
    {
      id: 2,
      request_id: 'OUT-20240101-0002',
      vendor_name: 'Another Vendor',
      status: 'sent',
      status_display: 'Sent',
      date_sent: '2024-01-01',
      expected_return_date: '2024-01-10',
      total_items: 1,
      is_overdue: true,
    },
  ];

  const mockSummary = {
    total_requests: 2,
    pending_returns: 1,
    overdue_returns: 1,
    recent_requests: 2,
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock localStorage for authentication
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'authToken') return 'mock-token';
      if (key === 'userRole') return 'manager';
      return null;
    });

    // Mock API responses
    const outsourcingAPI = require('@/components/API_Service/outsourcing-api');
    outsourcingAPI.getAll.mockResolvedValue(mockRequests);
    outsourcingAPI.getSummary.mockResolvedValue(mockSummary);
    outsourcingAPI.send.mockResolvedValue({ message: 'Request sent successfully' });
    outsourcingAPI.returnItems.mockResolvedValue({ message: 'Items returned successfully' });
    outsourcingAPI.close.mockResolvedValue({ message: 'Request closed successfully' });
  });

  test('renders outsourcing management page', async () => {
    render(<OutsourcingManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Outsourcing Management')).toBeInTheDocument();
      expect(screen.getByText('Track items sent to external vendors for processing')).toBeInTheDocument();
    });
  });

  test('displays summary statistics', async () => {
    render(<OutsourcingManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Requests')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // total_requests
      expect(screen.getByText('Pending Returns')).toBeInTheDocument();
      expect(screen.getByText('Overdue Returns')).toBeInTheDocument();
      expect(screen.getByText('Recent (30 days)')).toBeInTheDocument();
    });
  });

  test('displays outsourcing requests table', async () => {
    render(<OutsourcingManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Outsourcing Requests')).toBeInTheDocument();
      expect(screen.getByText('OUT-20240101-0001')).toBeInTheDocument();
      expect(screen.getByText('OUT-20240101-0002')).toBeInTheDocument();
      expect(screen.getByText('Test Vendor')).toBeInTheDocument();
      expect(screen.getByText('Another Vendor')).toBeInTheDocument();
    });
  });

  test('shows overdue indicator for overdue requests', async () => {
    render(<OutsourcingManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });
  });

  test('displays action buttons based on request status', async () => {
    render(<OutsourcingManagement />);
    
    await waitFor(() => {
      // Draft request should have Send button
      expect(screen.getByText('Send')).toBeInTheDocument();
      // Sent request should have Mark Returned button
      expect(screen.getByText('Mark Returned')).toBeInTheDocument();
      // All requests should have View button
      const viewButtons = screen.getAllByText('View');
      expect(viewButtons).toHaveLength(2);
    });
  });

  test('handles filter changes', async () => {
    render(<OutsourcingManagement />);
    
    await waitFor(() => {
      const statusFilter = screen.getByDisplayValue('All Statuses');
      fireEvent.change(statusFilter, { target: { value: 'sent' } });
      
      // Should call API with new filter
      const outsourcingAPI = require('@/components/API_Service/outsourcing-api');
      expect(outsourcingAPI.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'sent' })
      );
    });
  });

  test('handles search input', async () => {
    render(<OutsourcingManagement />);
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by request ID or vendor...');
      fireEvent.change(searchInput, { target: { value: 'OUT-20240101-0001' } });
      
      // Should call API with search term
      const outsourcingAPI = require('@/components/API_Service/outsourcing-api');
      expect(outsourcingAPI.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'OUT-20240101-0001' })
      );
    });
  });

  test('handles send request action', async () => {
    render(<OutsourcingManagement />);
    
    await waitFor(() => {
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      // Should call send API
      const outsourcingAPI = require('@/components/API_Service/outsourcing-api');
      expect(outsourcingAPI.send).toHaveBeenCalledWith(
        1, // request ID
        expect.objectContaining({
          date_sent: expect.any(String),
          vendor_contact_person: '',
        })
      );
    });
  });

  test('handles return items action', async () => {
    render(<OutsourcingManagement />);
    
    await waitFor(() => {
      const returnButton = screen.getByText('Mark Returned');
      fireEvent.click(returnButton);
      
      // Should call returnItems API
      const outsourcingAPI = require('@/components/API_Service/outsourcing-api');
      expect(outsourcingAPI.returnItems).toHaveBeenCalledWith(
        2, // request ID
        expect.objectContaining({
          collection_date: expect.any(String),
          collected_by_id: 1,
          returned_items: expect.any(Array),
        })
      );
    });
  });

  test('redirects to login for unauthenticated users', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'authToken') return null;
      return null;
    });

    const mockPush = jest.fn();
    jest.doMock('next/navigation', () => ({
      useRouter: () => ({
        push: mockPush,
        back: jest.fn(),
      }),
    }));

    render(<OutsourcingManagement />);
    
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  test('redirects to login for unauthorized roles', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'authToken') return 'mock-token';
      if (key === 'userRole') return 'operator'; // Unauthorized role
      return null;
    });

    const mockPush = jest.fn();
    jest.doMock('next/navigation', () => ({
      useRouter: () => ({
        push: mockPush,
        back: jest.fn(),
      }),
    }));

    render(<OutsourcingManagement />);
    
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
