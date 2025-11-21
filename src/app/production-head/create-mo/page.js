"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SimplifiedManufacturingOrderForm from '@/components/manager/SimplifiedManufacturingOrderForm';
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';

export default function CreateMOPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stockData, setStockData] = useState(null);

  // Check authentication and role - allow both production_head and manager
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole');
      
      // Allow both production_head and manager roles
      if (!token || (userRole !== 'production_head' && userRole !== 'manager')) {
        router.push('/production-head');
        return;
      }
      
      // Get user info from localStorage
      const userData = localStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleMOSuccess = () => {
    // Navigate back to dashboard after successful MO creation
    router.replace('/production-head/dashboard');
  };

  const handleBack = () => {
    router.replace('/production-head/dashboard');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <span className="text-xl">←</span>
                <span className="font-medium">Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-slate-300"></div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Create Manufacturing Order</h1>
                <p className="text-sm text-slate-600">Plan and initiate production orders</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-slate-700">
                  {user?.first_name} {user?.last_name}
                </div>
                <div className="text-xs text-slate-500 capitalize">
                  {user?.primary_role?.name || 'Production Head'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-10 gap-6">
          {/* Form Section - 70% */}
          <div className="xl:col-span-7">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl shadow-slate-200/50 p-8">
              <SimplifiedManufacturingOrderForm 
                onSuccess={handleMOSuccess} 
                onStockDataChange={setStockData}
              />
            </div>
          </div>

          {/* Right Panel - FG Stock Info - 30% */}
          <div className="xl:col-span-3">
            {stockData?.selectedProductDetails && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4 sticky top-24">
                <h3 className="text-sm font-bold text-green-800 mb-3 flex items-center space-x-2">
                  <span>📦</span>
                  <span>FG Stock Available</span>
                </h3>

                {stockData.fetchingFGStock ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Loose Stock Display */}
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <div className="text-xs text-slate-600 mb-1">Loose FG Stock</div>
                      <div className={`text-2xl font-bold ${(stockData.looseFGStock?.total_loose_stock || 0) > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                        {stockData.looseFGStock?.total_loose_stock || 0}
                        <span className="text-sm font-normal text-slate-500 ml-1">pieces</span>
                      </div>
                      {(stockData.looseFGStock?.total_loose_stock || 0) > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Available in FG store
                        </p>
                      )}
                    </div>

                    {/* Stock Warnings */}
                    {stockData.stockWarning && (
                      <div className="bg-orange-50 border border-orange-300 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <span className="text-orange-500 text-lg">⚠️</span>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-orange-900 mb-2">{stockData.stockWarning.title}</p>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-orange-700 font-medium">Available:</span>
                                <span className="text-orange-900 font-semibold">{stockData.stockWarning.available}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-orange-700 font-medium">Required:</span>
                                <span className="text-orange-900 font-semibold">{stockData.stockWarning.required}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-orange-600">For:</span>
                                <span className="text-orange-800">{stockData.stockWarning.forQuantity}</span>
                              </div>
                              <div className="pt-1 mt-1 border-t border-orange-200 flex justify-between">
                                <span className="text-red-700 font-bold">RM Shortage:</span>
                                <span className="text-red-900 font-bold">{stockData.stockWarning.shortage}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Create PO Button with Smart Production Info */}
                    {stockData.isStockInsufficient && stockData.selectedProductDetails?.materials && (
                      <div className="space-y-2">
                        {/* Info Box - Show what will happen */}
                        {(() => {
                          const totalAvailable = stockData.selectedProductDetails.materials.reduce((sum, m) => sum + (m.available_quantity || 0), 0);
                          const gramsPerProd = parseFloat(stockData.selectedProductDetails.product?.grams_per_product || 0);
                          const canMake = totalAvailable > 0 && gramsPerProd > 0 
                            ? Math.floor((totalAvailable * 1000) / gramsPerProd) 
                            : 0;
                          
                          if (canMake > 0) {
                            return (
                              <div className="bg-blue-50 border border-blue-300 rounded-lg p-3">
                                <div className="flex items-start space-x-2">
                                  <span className="text-blue-500 text-lg">💡</span>
                                  <div className="flex-1">
                                    <p className="text-xs font-bold text-blue-900 mb-1">Smart Production Plan</p>
                                    <p className="text-xs text-blue-700 mb-2">
                                      Can produce <strong>{canMake} pieces</strong> with available stock now!
                                    </p>
                                    <p className="text-xs text-blue-600">
                                      Clicking "Create PO" will:
                                    </p>
                                    <ul className="text-xs text-blue-700 ml-3 mt-1 space-y-0.5">
                                      <li>• Create PO for shortage</li>
                                      <li>• Auto-create MO for {canMake} pcs</li>
                                      <li>• Start production immediately</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        
                        <button
                          type="button"
                          onClick={() => stockData.handleCreatePO()}
                          className="w-full px-4 py-3 text-sm bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-medium hover:from-amber-700 hover:to-orange-700 transition-all shadow-md shadow-amber-600/25 flex items-center justify-center space-x-2"
                          title="Create Purchase Order and Partial MO"
                        >
                          <span>📦</span>
                          <span>Create PO & Partial MO</span>
                        </button>
                      </div>
                    )}

                    {/* Material Requirement with Tolerance */}
                    {stockData.materialWithTolerance && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                        <p className="text-xs font-bold text-indigo-800 mb-2">📊 Material Required</p>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-indigo-700">Base Material:</span>
                            <span className="text-indigo-900 font-semibold">{stockData.materialWithTolerance.baseMaterial.toFixed(2)} kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-indigo-700">Tolerance ({stockData.formData?.tolerance_percentage || 0}%):</span>
                            <span className="text-indigo-900 font-semibold">+{stockData.materialWithTolerance.tolerance.toFixed(2)} kg</span>
                          </div>
                          <div className="pt-2 mt-2 border-t border-indigo-200 flex justify-between">
                            <span className="text-indigo-800 font-bold">Total Required:</span>
                            <span className="text-indigo-900 font-bold text-sm">{stockData.materialWithTolerance.totalMaterial.toFixed(2)} kg</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Stock Info */}
                    {!stockData.isStockInsufficient && stockData.formData?.quantity && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-800 mb-1">✓ Stock Sufficient</p>
                        <p className="text-xs text-blue-700">
                          All materials available for production
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
    </div>
  );
}
