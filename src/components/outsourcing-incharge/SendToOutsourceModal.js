"use client";

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import manufacturingAPI from '@/components/API_Service/manufacturing-api';
import outsourcingAPI from '@/components/API_Service/outsourcing-api';

export default function SendToOutsourceModal({ isOpen, onClose, batch, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [moProcessExecutions, setMoProcessExecutions] = useState([]);
  
  const [formData, setFormData] = useState({
    mo_id: '',
    batch_ids: [],
    process_id: '',
    vendor_id: '',
    quantity_sent_kg: '',
    expected_return_date: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchVendors();
      fetchBatches();
    }
  }, [isOpen]);

  const fetchVendors = async () => {
    try {
      // Fetch vendors from third party API
      const response = await fetch('/api/third_party/vendors/', {
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      setVendors(data.results || data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      // Fetch batches with outsourcing processes
      const response = await manufacturingAPI.batches.getAll({ status: 'in_process' });
      if (response && !response.error) {
        setBatches(response.results || response.batches || []);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchProcessExecutions = async (moId) => {
    try {
      // Fetch process executions for selected MO
      const response = await manufacturingAPI.manufacturingOrders.getProcessExecutions(moId);
      if (response && !response.error) {
        // Filter only outsourcing processes
        const outsourcingProcesses = response.filter(pe => 
          pe.process?.is_outsourced || pe.process?.name?.toLowerCase().includes('outsource')
        );
        setMoProcessExecutions(outsourcingProcesses);
      }
    } catch (error) {
      console.error('Error fetching process executions:', error);
    }
  };

  const handleMOChange = (moId) => {
    setFormData({ ...formData, mo_id: moId, batch_ids: [], process_id: '' });
    if (moId) {
      fetchProcessExecutions(moId);
      // Filter batches by MO
      const filteredBatches = batches.filter(b => b.mo?.id === parseInt(moId));
      // You can set filtered batches if needed
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create outsourcing request
      const requestData = {
        vendor: parseInt(formData.vendor_id),
        expected_return_date: formData.expected_return_date,
        notes: formData.notes,
        items: formData.batch_ids.map(batchId => {
          const batch = batches.find(b => b.id === parseInt(batchId));
          return {
            mo_number: batch?.mo?.mo_id || '',
            product_code: batch?.product_code?.product_code || '',
            qty: batch?.planned_quantity || 0,
            kg: parseFloat(formData.quantity_sent_kg) || 0,
            batch_id: batchId,
            process_id: formData.process_id
          };
        })
      };

      const result = await outsourcingAPI.create(requestData);
      
      if (result && !result.error) {
        // Immediately send the request
        await outsourcingAPI.send(result.id, {
          date_sent: new Date().toISOString().split('T')[0],
          vendor_contact_person: ''
        });
        
        alert('Batch sent to outsource successfully!');
        onSuccess();
        onClose();
      } else {
        alert(`Error: ${result.message || 'Failed to send batch'}`);
      }
    } catch (error) {
      console.error('Error sending to outsource:', error);
      alert('Error sending batch to outsource');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSelection = (batchId) => {
    const currentSelection = formData.batch_ids;
    if (currentSelection.includes(batchId)) {
      setFormData({
        ...formData,
        batch_ids: currentSelection.filter(id => id !== batchId)
      });
    } else {
      setFormData({
        ...formData,
        batch_ids: [...currentSelection, batchId]
      });
    }
  };

  if (!isOpen) return null;

  // Get unique MOs from batches
  const uniqueMOs = [...new Map(batches.map(b => [b.mo?.id, b.mo])).values()].filter(mo => mo);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-slate-800">Send to Outsource</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* MO Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manufacturing Order (MO) <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.mo_id}
              onChange={(e) => handleMOChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Select MO</option>
              {uniqueMOs.map((mo) => (
                <option key={mo.id} value={mo.id}>
                  {mo.mo_id} - {mo.product_code?.display_name || 'Product'}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Selection */}
          {formData.mo_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Batches <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                {batches
                  .filter(b => b.mo?.id === parseInt(formData.mo_id))
                  .map((batch) => (
                    <label
                      key={batch.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.batch_ids.includes(batch.id)}
                        onChange={() => handleBatchSelection(batch.id)}
                        className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        {batch.batch_id} - {(batch.planned_quantity / 1000).toFixed(3)} kg
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          )}

          {/* Process Selection */}
          {moProcessExecutions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Process Name <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.process_id}
                onChange={(e) => setFormData({ ...formData, process_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Select Process</option>
                {moProcessExecutions.map((pe) => (
                  <option key={pe.id} value={pe.process.id}>
                    {pe.process.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Vendor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.vendor_id}
              onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Select Vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity Sent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity Sent (kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.001"
              required
              value={formData.quantity_sent_kg}
              onChange={(e) => setFormData({ ...formData, quantity_sent_kg: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Enter quantity in kg"
            />
          </div>

          {/* Expected Return Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Return Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.expected_return_date}
              onChange={(e) => setFormData({ ...formData, expected_return_date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Add any special instructions or notes"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formData.batch_ids.length === 0}
              className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send to Outsource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


