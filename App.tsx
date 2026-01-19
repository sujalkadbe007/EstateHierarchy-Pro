
import React, { useState, useMemo, useCallback } from 'react';
import { Employee, SaleRecord, AppView, CommissionPart } from './types';
import { INITIAL_OWNER, MAX_STAGES } from './constants';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import HierarchyView from './components/HierarchyView';
import SalesLog from './components/SalesLog';
import AddEmployeeModal from './components/AddEmployeeModal';
import RecordSaleModal from './components/RecordSaleModal';

const App: React.FC = () => {
  const [employees, setEmployees] = useState<Record<string, Employee>>({
    [INITIAL_OWNER.id]: INITIAL_OWNER
  });
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  // Logic to calculate commission based on the prompt's rules
  const calculateCommissions = (sellerId: string, saleAmount: number): CommissionPart[] => {
    const breakdown: CommissionPart[] = [];
    const seller = employees[sellerId];
    if (!seller) return breakdown;

    // 1. Seller always gets 5% (as per "3rd stage employee gets 5%")
    breakdown.push({
      employeeId: seller.id,
      employeeName: seller.name,
      percentage: 5,
      amount: saleAmount * 0.05,
      role: 'Seller'
    });

    let currentParentId = seller.parentId;
    let depth = 1;
    const owner = employees[INITIAL_OWNER.id];

    // Traverse up the chain
    while (currentParentId) {
      const parent = employees[currentParentId];
      if (!parent) break;

      let commissionPercent = 0;

      if (parent.level === 0) {
        // Owner logic:
        // "Owner gets 5% if direct employee (L1) sells"
        // "Owner gets 2% if L3 sells (and others)"
        // "Until stage 6 until owner earn 15%, then +1% each stage"
        
        if (seller.level === 1) {
          commissionPercent = 5;
        } else if (seller.level <= 6) {
          commissionPercent = 2;
        } else {
          // Rule: "after stage 6 he will get +1% of commission"
          // Stage 7 = 2% + 1% = 3%, Stage 8 = 4% etc.
          commissionPercent = 2 + (seller.level - 6);
        }
      } else {
        // Intermediary Manager logic:
        // "2nd stage gets 2% if 3rd stage sells" (Direct Manager)
        if (parent.id === seller.parentId) {
          commissionPercent = 2;
        } else {
          // Generic override for ancestors? 
          // Prompt says "it is same as for employees also"
          // We'll give higher ancestors 1% as a standard override logic if not explicitly stated
          commissionPercent = 1; 
        }
      }

      if (commissionPercent > 0) {
        breakdown.push({
          employeeId: parent.id,
          employeeName: parent.name,
          percentage: commissionPercent,
          amount: saleAmount * (commissionPercent / 100),
          role: parent.level === 0 ? 'Owner Override' : 'Manager Override'
        });
      }

      currentParentId = parent.parentId;
      depth++;
    }

    return breakdown;
  };

  const handleAddEmployee = (name: string, role: string, parentId: string) => {
    const parent = employees[parentId];
    if (!parent || parent.level >= MAX_STAGES) return;

    const newId = `emp-${Math.random().toString(36).substr(2, 9)}`;
    const newEmployee: Employee = {
      id: newId,
      name,
      role,
      level: parent.level + 1,
      parentId: parentId,
      totalSales: 0,
      commissionsEarned: 0,
      dateJoined: new Date().toISOString(),
      childrenIds: []
    };

    setEmployees(prev => ({
      ...prev,
      [parentId]: {
        ...prev[parentId],
        childrenIds: [...prev[parentId].childrenIds, newId]
      },
      [newId]: newEmployee
    }));
    setIsAddModalOpen(false);
  };

  const handleRecordSale = (sellerId: string, amount: number, plotName: string) => {
    const breakdown = calculateCommissions(sellerId, amount);
    const newSale: SaleRecord = {
      id: `sale-${Date.now()}`,
      sellerId,
      amount,
      plotName,
      date: new Date().toISOString(),
      commissionBreakdown: breakdown
    };

    setSales(prev => [newSale, ...prev]);

    // Update individual earnings
    setEmployees(prev => {
      const next = { ...prev };
      breakdown.forEach(part => {
        if (next[part.employeeId]) {
          next[part.employeeId] = {
            ...next[part.employeeId],
            commissionsEarned: next[part.employeeId].commissionsEarned + part.amount,
            totalSales: part.employeeId === sellerId ? next[part.employeeId].totalSales + amount : next[part.employeeId].totalSales
          };
        }
      });
      return next;
    });

    setIsSaleModalOpen(false);
  };

  const openAddModal = (parentId: string | null = INITIAL_OWNER.id) => {
    setSelectedParentId(parentId);
    setIsAddModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-bold text-slate-800">
            {currentView === AppView.DASHBOARD && 'Executive Dashboard'}
            {currentView === AppView.HIERARCHY && 'Organizational Hierarchy'}
            {currentView === AppView.SALES && 'Sales Ledger'}
            {currentView === AppView.ANALYTICS && 'Performance Analytics'}
          </h1>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsSaleModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Record Plot Sale
            </button>
            <button 
              onClick={() => openAddModal(INITIAL_OWNER.id)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Add Direct Member
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {currentView === AppView.DASHBOARD && (
            <Dashboard employees={employees} sales={sales} />
          )}
          {currentView === AppView.HIERARCHY && (
            <HierarchyView 
              employees={employees} 
              onAddMember={openAddModal} 
            />
          )}
          {currentView === AppView.SALES && (
            <SalesLog sales={sales} employees={employees} />
          )}
        </div>
      </main>

      {isAddModalOpen && (
        <AddEmployeeModal 
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddEmployee}
          employees={employees}
          initialParentId={selectedParentId}
        />
      )}

      {isSaleModalOpen && (
        <RecordSaleModal 
          isOpen={isSaleModalOpen}
          onClose={() => setIsSaleModalOpen(false)}
          onRecord={handleRecordSale}
          employees={employees}
        />
      )}
    </div>
  );
};

export default App;
