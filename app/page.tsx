"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Minus, ShoppingCart, Trash2, X, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';

// 型定義
interface Item {
  id: string;
  name: string;
  currentStock: number;
  dailyConsumption: number;
  unit: string;
}

const INITIAL_DATA: Item[] = [
  { id: '1', name: '水', currentStock: 24, dailyConsumption: 2, unit: '本' },
  { id: '2', name: 'レトルトご飯', currentStock: 15, dailyConsumption: 1, unit: 'パック' },
  { id: '3', name: 'トイレットペーパー', currentStock: 12, dailyConsumption: 0.5, unit: 'ロール' },
  { id: '4', name: 'レトルトカレー', currentStock: 10, dailyConsumption: 0.5, unit: '個' },
  { id: '5', name: '粉末スポーツドリンク', currentStock: 20, dailyConsumption: 1, unit: '袋' },
  { id: '6', name: 'プロテインバー', currentStock: 14, dailyConsumption: 1, unit: '本' },
];

export default function RollingStockApp() {
  const [items, setItems] = useState<Item[]>([]);
  const [thresholdDays, setThresholdDays] = useState(30);
  const [isAdding, setIsAdding] = useState(false);
  
  // 新規追加用フォームの状態
  const [newItem, setNewItem] = useState({ name: '', stock: '', consumption: '', unit: '個' });

  // 初期ロード & 自動消費
  useEffect(() => {
    const savedItems = localStorage.getItem('rs-items');
    const savedDate = localStorage.getItem('rs-last-date');
    const savedThreshold = localStorage.getItem('rs-threshold');

    let currentItems = savedItems ? JSON.parse(savedItems) : INITIAL_DATA;
    const today = new Date().toISOString().split('T')[0];

    if (savedDate && savedDate !== today) {
      const diffTime = Math.abs(new Date(today).getTime() - new Date(savedDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      currentItems = currentItems.map((item: Item) => ({
        ...item,
        currentStock: Math.max(0, item.currentStock - (item.dailyConsumption * diffDays))
      }));
    }

    setItems(currentItems);
    setThresholdDays(savedThreshold ? parseInt(savedThreshold) : 30);
    localStorage.setItem('rs-last-date', today);
  }, []);

  // 保存用
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('rs-items', JSON.stringify(items));
      localStorage.setItem('rs-threshold', thresholdDays.toString());
    }
  }, [items, thresholdDays]);

  // 在庫操作
  const updateStock = (id: string, amount: number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, currentStock: Math.max(0, Number(item.currentStock) + amount) } : item
    ));
  };

  // アイテム追加
  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.stock || !newItem.consumption) return;

    const item: Item = {
      id: Date.now().toString(),
      name: newItem.name,
      currentStock: parseFloat(newItem.stock),
      dailyConsumption: parseFloat(newItem.consumption),
      unit: newItem.unit
    };

    setItems([...items, item]);
    setNewItem({ name: '', stock: '', consumption: '', unit: '個' });
    setIsAdding(false);
  };

  // アイテム削除
  const deleteItem = (id: string) => {
    if (confirm('このアイテムを削除していいか、ベジ？')) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const getStatus = (item: Item) => {
    const remainingDays = item.currentStock / item.dailyConsumption;
    return remainingDays < thresholdDays ? 'low' : 'ok';
  };

  const copyShoppingList = () => {
    const lowStockItems = items.filter(item => getStatus(item) === 'low');
    const text = lowStockItems.map(item => `・${item.name} (${item.unit})`).join('\n');
    navigator.clipboard.writeText(`【Rolling Stock 要補充】\n${text}`);
    alert('買い物リストをコピーしたぞ！');
  };

  return (
    <div className="min-h-screen bg-[#fdfcf0] text-stone-800 p-4 font-sans pb-32">
      {/* Header */}
      <header className="max-w-md mx-auto mb-8 border-b-2 border-stone-300 pb-4">
        <div className="flex justify-between items-end">
          <h1 className="text-2xl font-bold tracking-tight text-stone-700">Rolling Stock List</h1>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="text-stone-500 hover:text-stone-800 transition-colors"
          >
            {isAdding ? <X size={24} /> : <PlusCircle size={24} />}
          </button>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-stone-500 italic">
          <span>Notepad Style / Local DB</span>
          <select 
            className="bg-transparent border-none focus:ring-0 cursor-pointer font-bold text-stone-700"
            value={thresholdDays}
            onChange={(e) => setThresholdDays(parseInt(e.target.value))}
          >
            <option value={7}>Alert: 1 Week</option>
            <option value={14}>Alert: 2 Weeks</option>
            <option value={30}>Alert: 1 Month</option>
            <option value={90}>Alert: 3 Months</option>
          </select>
        </div>
      </header>

      <main className="max-w-md mx-auto space-y-6">
        {/* Add Form */}
        {isAdding && (
          <form onSubmit={addItem} className="bg-white p-6 rounded-lg border-2 border-stone-200 shadow-sm space-y-4 mb-8">
            <input 
              placeholder="品名 (例: カップ麺)" 
              className="w-full border-b border-stone-200 p-2 focus:outline-none focus:border-stone-500"
              value={newItem.name}
              onChange={e => setNewItem({...newItem, name: e.target.value})}
            />
            <div className="flex gap-4">
              <input 
                placeholder="在庫量" type="number" step="0.1"
                className="w-1/3 border-b border-stone-200 p-2 focus:outline-none focus:border-stone-500"
                value={newItem.stock}
                onChange={e => setNewItem({...newItem, stock: e.target.value})}
              />
              <input 
                placeholder="単位" 
                className="w-1/3 border-b border-stone-200 p-2 focus:outline-none focus:border-stone-500"
                value={newItem.unit}
                onChange={e => setNewItem({...newItem, unit: e.target.value})}
              />
            </div>
            <input 
              placeholder="1日の消費量 (例: 0.5)" type="number" step="0.1"
              className="w-full border-b border-stone-200 p-2 focus:outline-none focus:border-stone-500"
              value={newItem.consumption}
              onChange={e => setNewItem({...newItem, consumption: e.target.value})}
            />
            <button type="submit" className="w-full bg-stone-800 text-white py-2 rounded-md font-bold">追加する</button>
          </form>
        )}

        {/* Item List */}
        <div className="space-y-4">
          {items.map(item => {
            const isLow = getStatus(item) === 'low';
            return (
              <div key={item.id} className="relative group bg-white border border-stone-200 shadow-sm rounded-r-md">
                {/* Notepad Red Margin Line */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400 opacity-60"></div>
                
                <div className="p-4 pl-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-bold text-stone-700">{item.name}</h2>
                      <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
                        Consumption: {item.dailyConsumption} {item.unit} / day
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => deleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                      {isLow ? <AlertCircle className="text-red-500 w-5 h-5" /> : <CheckCircle2 className="text-emerald-500 w-5 h-5" />}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-3xl font-mono font-medium text-stone-800">
                      {Math.floor(item.currentStock * 10) / 10} <span className="text-xs font-sans text-stone-400 uppercase">{item.unit}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-stone-50 rounded-full p-1 border border-stone-100">
                      <button onClick={() => updateStock(item.id, -1)} className="p-2 hover:bg-white rounded-full transition-colors"><Minus size={18}/></button>
                      <div className="w-px h-4 bg-stone-200"></div>
                      <button onClick={() => updateStock(item.id, 1)} className="p-2 hover:bg-white rounded-full transition-colors"><Plus size={18}/></button>
                    </div>
                  </div>

                  {/* Tiny Speed Slider */}
                  <div className="mt-4 flex items-center gap-4">
                    <span className="text-[10px] text-stone-400 whitespace-nowrap">PACE</span>
                    <input 
                      type="range" min="0.1" max="5" step="0.1" 
                      value={item.dailyConsumption}
                      onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, dailyConsumption: parseFloat(e.target.value)} : i))}
                      className="w-full h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-stone-400"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
        <button 
          onClick={copyShoppingList}
          className="w-full flex items-center justify-center gap-3 bg-stone-800 text-white py-4 rounded-xl shadow-2xl hover:bg-stone-700 active:scale-95 transition-all"
        >
          <ShoppingCart size={20} />
          <span className="font-bold tracking-widest text-sm uppercase">Shopping List</span>
        </button>
      </div>
    </div>
  );
}